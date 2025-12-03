from imagekitio import ImageKit
from imagekitio.models.UploadFileRequestOptions import UploadFileRequestOptions
from typing import List, Optional, Dict
import httpx

from app.core.config import settings


class ImageKitClient:
    """
    ImageKit client for image transformations and CDN delivery.
    Integrates with IPFS - pulls images from IPFS gateway and serves via ImageKit CDN.
    """
    
    def __init__(self):
        self.imagekit = ImageKit(
            private_key=settings.IMAGEKIT_PRIVATE_KEY,
            public_key=settings.IMAGEKIT_PUBLIC_KEY,
            url_endpoint=settings.IMAGEKIT_URL
        )
        self.ipfs_gateway = settings.IPFS_GATEWAY_URL
        
    def get_ipfs_url_via_imagekit(
        self,
        ipfs_hash: str,
        transformations: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Generate ImageKit URL that pulls from IPFS.
        
        Args:
            ipfs_hash: IPFS CID (e.g., "QmXxx...")
            transformations: List of ImageKit transformations
                Example: [{"width": "400", "height": "300"}]
        
        Returns:
            ImageKit CDN URL with transformations
        """
        # Build IPFS source URL
        ipfs_source_url = f"{self.ipfs_gateway}/{ipfs_hash}"
        
        # Generate ImageKit URL
        imagekit_url = self.imagekit.url({
            "src": ipfs_source_url,
            "transformation": transformations or []
        })
        
        return imagekit_url
    
    def get_property_image_urls(
        self,
        ipfs_hashes: List[str],
        include_variants: bool = True
    ) -> Dict[str, List[str]]:
        """
        Generate multiple variants of property images.
        
        Args:
            ipfs_hashes: List of IPFS CIDs for property images
            include_variants: Generate thumbnail, medium, large variants
        
        Returns:
            Dict with different image sizes:
            {
                "thumbnails": [...],
                "medium": [...],
                "large": [...],
                "original": [...]
            }
        """
        result = {
            "original": [],
            "thumbnails": [],
            "medium": [],
            "large": []
        }
        
        for ipfs_hash in ipfs_hashes:
            # Original (no transformation)
            original = self.get_ipfs_url_via_imagekit(ipfs_hash)
            result["original"].append(original)
            
            if include_variants:
                # Thumbnail (400x300, cropped)
                thumbnail = self.get_ipfs_url_via_imagekit(
                    ipfs_hash,
                    [
                        {"width": "400", "height": "300", "crop": "maintain_ratio"},
                        {"quality": "80"},
                        {"format": "webp"}
                    ]
                )
                result["thumbnails"].append(thumbnail)
                
                # Medium (800x600)
                medium = self.get_ipfs_url_via_imagekit(
                    ipfs_hash,
                    [
                        {"width": "800", "height": "600", "crop": "maintain_ratio"},
                        {"quality": "85"},
                        {"format": "webp"}
                    ]
                )
                result["medium"].append(medium)
                
                # Large (1200x900)
                large = self.get_ipfs_url_via_imagekit(
                    ipfs_hash,
                    [
                        {"width": "1200", "height": "900", "crop": "maintain_ratio"},
                        {"quality": "90"},
                        {"format": "webp"}
                    ]
                )
                result["large"].append(large)
        
        return result
    
    def get_single_image_variants(self, ipfs_hash: str) -> Dict[str, str]:
        """
        Get all variants of a single image.
        Useful for property cover images, user avatars, etc.
        """
        return {
            "original": self.get_ipfs_url_via_imagekit(ipfs_hash),
            "thumbnail": self.get_ipfs_url_via_imagekit(
                ipfs_hash,
                [{"width": "400", "height": "300"}, {"format": "webp"}]
            ),
            "medium": self.get_ipfs_url_via_imagekit(
                ipfs_hash,
                [{"width": "800", "height": "600"}, {"format": "webp"}]
            ),
            "large": self.get_ipfs_url_via_imagekit(
                ipfs_hash,
                [{"width": "1200", "height": "900"}, {"format": "webp"}]
            ),
            "hero": self.get_ipfs_url_via_imagekit(
                ipfs_hash,
                [{"width": "1920", "height": "1080"}, {"format": "webp"}]
            )
        }
    
    async def upload_from_ipfs(
        self,
        ipfs_hash: str,
        file_name: str,
        folder: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Upload an image from IPFS to ImageKit storage (optional).
        This caches the image permanently in ImageKit.
        
        Use this if you want to permanently store images in ImageKit
        instead of just proxying from IPFS.
        """
        try:
            # Fetch image from IPFS
            ipfs_url = f"{self.ipfs_gateway}/{ipfs_hash}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(ipfs_url)
                response.raise_for_status()
                image_bytes = response.content
            
            # Upload to ImageKit
            upload_options = UploadFileRequestOptions(
                folder=folder or settings.IMAGEKIT_FOLDER,
                use_unique_file_name=False,
                custom_coordinates="",
                tags=["ipfs", ipfs_hash]
            )
            
            result = self.imagekit.upload_file(
                file=image_bytes,
                file_name=file_name,
                options=upload_options
            )
            
            return {
                "file_id": result.file_id,
                "url": result.url,
                "thumbnail_url": result.thumbnail_url,
                "name": result.name
            }
            
        except Exception as e:
            print(f"❌ Failed to upload {ipfs_hash} to ImageKit: {e}")
            return None
    
    def get_responsive_image_urls(
        self,
        ipfs_hash: str,
        widths: List[int] = [400, 800, 1200, 1920]
    ) -> List[Dict[str, str]]:
        """
        Generate srcset for responsive images.
        
        Returns list of URLs with different widths for <img srcset>
        
        Example usage in frontend:
        <img 
            srcset="url1 400w, url2 800w, url3 1200w"
            sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
            src="url2"
        />
        """
        variants = []
        
        for width in widths:
            url = self.get_ipfs_url_via_imagekit(
                ipfs_hash,
                [
                    {"width": str(width)},
                    {"quality": "85"},
                    {"format": "webp"}
                ]
            )
            variants.append({
                "url": url,
                "width": width,
                "descriptor": f"{width}w"
            })
        
        return variants
    
    def get_optimized_url(
        self,
        ipfs_hash: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        quality: int = 85,
        format: str = "auto"
    ) -> str:
        """
        Get optimized image URL with custom parameters.
        
        Args:
            ipfs_hash: IPFS CID
            width: Target width in pixels
            height: Target height in pixels
            quality: Image quality (1-100)
            format: Output format ("auto", "webp", "jpg", "png")
        """
        transformations = []
        
        if width:
            transformations.append({"width": str(width)})
        if height:
            transformations.append({"height": str(height)})
        
        transformations.append({"quality": str(quality)})
        
        if format != "auto":
            transformations.append({"format": format})
        
        return self.get_ipfs_url_via_imagekit(ipfs_hash, transformations)


# Global instance
imagekit_client = ImageKitClient()
