from langchain_groq import ChatGroq
from langchain_community.vectorstores.faiss import FAISS
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from typing import Optional, List
import os
import pickle
from pathlib import Path

from app.core.config import get_settings

settings = get_settings()


class StacksStayRAG:
    """RAG system for StacksStay platform knowledge"""

    def __init__(self):
        self.embeddings = FastEmbedEmbeddings(
            model_name=settings.EMBEDDING_MODEL
        )
        self.vector_store = None
        self.qa_chain = None
        self._initialize()

    def _load_knowledge_files(self) -> str:
        """Load all knowledge base files and combine them"""

        # Define all knowledge files to load
        knowledge_files = [
            "knowledge_base.txt",
            "faq.txt",
            "smart_contracts.txt",
            "troubleshooting.txt"
        ]

        combined_content = []
        base_path = Path(__file__).parent

        for filename in knowledge_files:
            file_path = base_path / filename

            if file_path.exists():
                print(f"✅ Loading: {filename}")
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    combined_content.append(f"\n\n# SOURCE: {filename}\n{content}")
            else:
                print(f"⚠️ Skipping (not found): {filename}")

        if not combined_content:
            raise FileNotFoundError("No knowledge base files found!")

        return "\n\n".join(combined_content)

    def _initialize(self):
        """Initialize vector store and QA chain"""

        # Load all knowledge base files
        documents = self._load_knowledge_files()

        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n## ", "\n### ", "\n\n", "\n", " "]
        )
        texts = text_splitter.split_text(documents)

        print(f"📚 Created {len(texts)} knowledge chunks")

        # Create vector store with FAISS
        faiss_index_path = Path(__file__).parent / "faiss_index"
        faiss_index_file = faiss_index_path / "index.faiss"
        faiss_pkl_file = faiss_index_path / "index.pkl"

        # Check if we can load existing index
        if faiss_index_file.exists() and faiss_pkl_file.exists():
            try:
                print("🔄 Loading existing FAISS index...")
                self.vector_store = FAISS.load_local(
                    str(faiss_index_path),
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                print("✅ FAISS index loaded successfully")
            except Exception as e:
                print(f"⚠️ Could not load existing index: {e}")
                print("🔄 Creating new FAISS index...")
                self.vector_store = FAISS.from_texts(
                    texts=texts,
                    embedding=self.embeddings
                )
                faiss_index_path.mkdir(exist_ok=True)
                self.vector_store.save_local(str(faiss_index_path))
                print("✅ FAISS index created and saved")
        else:
            print("🔄 Creating new FAISS index...")
            self.vector_store = FAISS.from_texts(
                texts=texts,
                embedding=self.embeddings
            )
            faiss_index_path.mkdir(exist_ok=True)
            self.vector_store.save_local(str(faiss_index_path))
            print("✅ FAISS index created and saved")

        # Create LLM
        llm = ChatGroq(
            model_name="llama3-8b-8192",  # Default free model on Groq
            groq_api_key=settings.GROQ_API_KEY,
            temperature=0.3,
            max_tokens=1000
        )

        # Create custom prompt
        prompt_template = """You are the StacksStay Assistant, an expert on the platform and blockchain technology.

Use the following context to answer the user's question accurately and helpfully.

Context:
{context}

Question: {question}

Guidelines:
- Be friendly and conversational
- Explain technical concepts in simple terms
- Use emojis to make it friendly (🔐, 💰, ⏰, 🏠, ⛓️)
- Relate blockchain concepts to familiar traditional systems
- Keep answers concise (2-4 sentences) unless details are requested
- Always emphasize wallet security
- If you're not sure, say so honestly

Answer:"""

        PROMPT = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question"]
        )

        # Create QA chain
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=self.vector_store.as_retriever(
                search_kwargs={"k": 4}  # Retrieve top 4 relevant chunks
            ),
            chain_type_kwargs={"prompt": PROMPT},
            return_source_documents=False
        )

    def ask(self, question: str) -> str:
        """Ask a question and get an answer from the knowledge base"""
        try:
            result = self.qa_chain.invoke({"query": question})
            return result["result"]
        except Exception as e:
            return f"I apologize, but I encountered an error: {str(e)}"

    def get_relevant_docs(self, question: str, k: int = 3) -> list:
        """Get relevant document chunks for a question"""
        return self.vector_store.similarity_search(question, k=k)