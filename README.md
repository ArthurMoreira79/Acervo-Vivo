# Acervo Vivo

Rede social para artesãos: dá visibilidade ao trabalho manual e compartilha a cultura popular de forma digital.

SPA (Single Page Application) feita só com HTML, CSS e JavaScript, sem frameworks e **sem banco de dados**.

## Acesse

👉 **https://acervo-vivo-three.vercel.app/#/login**

Não precisa instalar nada: basta abrir o link no navegador (computador ou celular), entrar com a conta de demonstração ou criar a sua.

**Conta de demonstração:** `maria@acervovivo.com` / senha `123456`
(as outras contas de exemplo usam o mesmo padrão: ana@, raimundo@, tereza@, jose@).

## Funcionalidades

- **Login e cadastro**: ao entrar, você vai direto para o Início.
- **Início (feed)**: publicações de todos os artesãos, da mais nova para a mais antiga, com filtro por técnica, curtidas e comentários.
- **Publicar obra**: título, técnica, descrição e foto opcional. Obras sem foto ganham uma ilustração gerada a partir da técnica (renda, cerâmica, cestaria, bordado…).
- **Meu perfil**: editar nome, ofício, cidade, foto, contato (Instagram e WhatsApp) e a seção **Sobre mim** (história, inspirações, técnicas e materiais). Também é possível editar e excluir as próprias obras.
- **Perfil de outros artesãos**: clique no nome de alguém para ver a história e as obras da pessoa.

## Rodar localmente (para desenvolvimento)

Abra o `index.html` direto no navegador (duplo clique) ou sirva a pasta do repositório:

```bash
npx http-server . -p 5173
```

Depois acesse http://localhost:5173.

## Como os dados são guardados

Não há banco de dados. Os dados ficam no `localStorage` do navegador (chave `acervoVivo:v1`):

- Na primeira visita, o app carrega os exemplos de `js/data.js`.
- Tudo o que você cria fica salvo **só naquele navegador**. Outro computador ou navegador não vê as mesmas publicações.
- Fotos são reduzidas automaticamente antes de salvar, mas o `localStorage` tem limite de ~5 MB.
- O botão "Restaurar dados de exemplo" (coluna esquerda do Início) volta ao estado inicial.

> As senhas ficam em texto puro no navegador. Isso serve para um protótipo, mas não para produção:
> quando houver back-end, a autenticação e as senhas (com hash) devem ficar no servidor.

## Estrutura

```
acervo-vivo/
├── index.html      # casca da SPA
├── css/style.css   # estilos (paleta barro, palha, anil)
└── js/
    ├── data.js     # dados de demonstração (pessoas fictícias)
    └── app.js      # rotas (#/login, #/inicio, #/perfil, #/artesao/:id), telas e eventos
```
