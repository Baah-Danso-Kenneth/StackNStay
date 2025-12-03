from typing import List, Dict, Optional
from app.utils.imageKit import imagekit_client
from app.models.blockchain import IPFSMetadata
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


class ImageService:
    """
    Service for managing property images with ImageKit transformations.
    """

    @staticmethod
    async def process_property_images(
            db: AsyncSession,
            property_id: int,
            image_cids: List[str]
    ) -> Dict[str, List[str]]:
        """
        Process property images and generate ImageKit URLs.
        Stores them in IPFSMetadata for caching.

        Returns dict with different image sizes.
        """
        if not image_cids:
            return {
                "thumbnails": [],
                "medium": [],
                "large": [],
                "original": []
            }

        # Generate all variants
        image_urls = imagekit_client.get_property_image_urls(
            image_cids,
            include_variants=True
        )

        # Cache the URLs in database
        for idx, ipfs_hash in enumerate(image_cids):
            # Check if already cached
            result = await db.execute(
                select(IPFSMetadata).where(
                    IPFSMetadata.ipfs_hash == ipfs_hash
                )
            )
            metadata = result.scalar_one_or_none()

            if metadata:
                # Update existing
                metadata.imagekit_urls = {
                    "original": image_urls["original"][idx],
                    "thumbnail": image_urls["thumbnails"][idx],
                    "medium": image_urls["medium"][idx],
                    "large": image_urls["large"][idx]
                }
            else:
                # Create new
                metadata = IPFSMetadata(
                    ipfs_hash=ipfs_hash,
                    entity_type="property_image",
                    entity_id=property_id,
                    imagekit_urls={
                        "original": image_urls["original"][idx],
                        "thumbnail": image_urls["thumbnails"][idx],
                        "medium": image_urls["medium"][idx],
                        "large": image_urls["large"][idx]
                    },
                    fetch_status="fetched"
                )
                db.add(metadata)

        await db.commit()

        return image_urls

    @staticmethod
    def get_cover_image_url(
            ipfs_hash: str,
            size: str = "medium"
    ) -> str:
        """
        Get property cover image in specific size.

        Args:
            ipfs_hash: IPFS CID of the image
            size: "thumbnail", "medium", "large", "hero"
        """
        variants = imagekit_client.get_single_image_variants(ipfs_hash)
        return variants.get(size, variants["medium"])

    @staticmethod
    def get_responsive_srcset(ipfs_hash: str) -> Dict[str, any]:
        """
        Generate responsive image data for frontend.

        Returns:
        {
            "src": "medium size URL",
            "srcset": "url1 400w, url2 800w, ...",
            "sizes": "(max-width: 600px) 400px, ..."
        }
        """
        variants = imagekit_client.get_responsive_image_urls(ipfs_hash)

        srcset = ", ".join([
            f"{v['url']} {v['descriptor']}"
            for v in variants
        ])

        return {
            "src": variants[1]["url"] if len(variants) > 1 else variants[0]["url"],
            "srcset": srcset,
            "sizes": "(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
        }


# Global instance
image_service = ImageService()