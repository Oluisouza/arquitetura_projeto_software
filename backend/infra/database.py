import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

_cliente: Client | None = None

def get_db_conexao() -> Client:
    global _cliente

    if _cliente is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")

        if not url or not key:
            raise ValueError("Faltam as credenciais do Supabase no arquivo .env")

        _cliente = create_client(url, key)

    return _cliente