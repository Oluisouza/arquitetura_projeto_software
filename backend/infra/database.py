import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("⚠️ Faltam as credenciais do Supabase no arquivo .env!")

supabase_cliente: Client = create_client(url, key)

def get_db_conexao() -> Client:
    """Retorna a instância de conexão com o Supabase."""
    return supabase_cliente