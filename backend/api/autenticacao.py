"""
Autenticacao e autorizacao do Cafe Teria.
"""

import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from supabase import create_client, Client

router = APIRouter(prefix="/auth", tags=["autenticacao"])
seguranca = HTTPBearer()


def _novo_cliente() -> Client:
    """
    Cria um cliente Supabase dedicado a cada requisicao de auth.
    """
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    return create_client(url, key)


def _buscar_papel(client: Client, user_id: str) -> str:
    """Le o papel do usuario na tabela perfis (fallback: atendente)."""
    resp = (
        client.table("perfis")
        .select("papel")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if resp.data:
        return resp.data[0]["papel"]
    return "atendente"



class LoginRequest(BaseModel):
    email: str
    senha: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    papel: str
    email: str


class UsuarioAutenticado(BaseModel):
    id: str
    email: str
    papel: str



@router.post("/login", response_model=LoginResponse)
def login(dados: LoginRequest):
    client = _novo_cliente()
    try:
        sessao = client.auth.sign_in_with_password(
            {"email": dados.email, "password": dados.senha}
        )
    except Exception:
        raise HTTPException(status_code=401, detail="E-mail ou senha invalidos")

    if not sessao.session:
        raise HTTPException(status_code=401, detail="E-mail ou senha invalidos")

    papel = _buscar_papel(client, sessao.user.id)
    return LoginResponse(
        access_token=sessao.session.access_token,
        refresh_token=sessao.session.refresh_token,
        papel=papel,
        email=sessao.user.email,
    )


def usuario_atual(
    cred: HTTPAuthorizationCredentials = Depends(seguranca),
) -> UsuarioAutenticado:
    """Valida o JWT recebido e devolve o usuario autenticado."""
    token = cred.credentials
    client = _novo_cliente()
    try:
        resp = client.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalido ou expirado")

    if resp is None or resp.user is None:
        raise HTTPException(status_code=401, detail="Token invalido ou expirado")

    papel = _buscar_papel(client, resp.user.id)
    return UsuarioAutenticado(id=resp.user.id, email=resp.user.email, papel=papel)


def requer_papel(*papeis_permitidos: str):
    """
    Fabrica de dependencia para proteger rotas por papel.

    Uso:
        @app.post("/produtos", dependencies=[Depends(requer_papel("gerente"))])
    """
    def verificador(
        usuario: UsuarioAutenticado = Depends(usuario_atual),
    ) -> UsuarioAutenticado:
        if usuario.papel not in papeis_permitidos:
            raise HTTPException(status_code=403, detail="Acesso negado para este papel")
        return usuario

    return verificador


@router.get("/me", response_model=UsuarioAutenticado)
def me(usuario: UsuarioAutenticado = Depends(usuario_atual)):
    """Retorna o usuario do token - util para o frontend revalidar a sessao."""
    return usuario