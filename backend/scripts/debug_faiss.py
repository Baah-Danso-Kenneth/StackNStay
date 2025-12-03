import langchain_community.vectorstores
print(dir(langchain_community.vectorstores))

try:
    from langchain_community.vectorstores import FAISS
    print("FAISS imported successfully from langchain_community.vectorstores")
except ImportError:
    print("Failed to import FAISS from langchain_community.vectorstores")
    try:
        from langchain_community.vectorstores.faiss import FAISS
        print("FAISS imported successfully from langchain_community.vectorstores.faiss")
    except ImportError:
        print("Failed to import FAISS from langchain_community.vectorstores.faiss")
