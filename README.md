# Cultura em Rede — Vitrine & Rede de Artesãos de São Luís

**Cultura em Rede** é uma plataforma e rede social voltada para divulgar, valorizar e dar visibilidade às obras desenvolvidas por artesãos e mestres da cultura popular de **São Luís do Maranhão** (azulejaria tradicional, fibra de buriti, bordados do Bumba Meu Boi, cerâmica, renda de bilro e xilogravura).

A página inicial adota uma estética visual inspirada no **Pinterest**, permitindo que visitantes naveguem livremente por publicações, descubram a riqueza cultural maranhense e se conectem diretamente com os produtores para aquisição e encomendas pelo WhatsApp e Instagram.

SPA (Single Page Application) construída em **HTML5, CSS3 moderno e JavaScript puro (Vanilla JS)**, sem dependências externas pesadas e **sem necessidade de banco de dados** (persistência em `localStorage`).

---

## 🌟 Principais Recursos

- **Home Aberta Estilo Pinterest (Sem Barramento)**:
  - Ao abrir o site, o usuário entra diretamente no feed/galeria pública de obras em layout *Masonry Grid*.
  - Visitantes não são bloqueados por tela de login e podem explorar livremente as criações, técnicas e perfis.
- **Botão de Chamada para Produtores**:
  - No início e no rodapé da página: *"Quer criar e divulgar suas obras? Comece por aqui"*, direcionando artesãos e produtores para a criação de conta ou login.
- **Cards de Obras Ricos em Contato**:
  - Cada card traz foto em destaque, técnica utilizada, título, breve descrição e os dados do artesão.
  - Links diretos e integrados para **WhatsApp** (com mensagem pré-configurada para encomenda) e **Instagram** do artesão.
  - Curtidas com contador.
- **Página de Perfil do Artesão**:
  - Ao clicar no nome ou foto do autor no post, o visitante é direcionado para a página do perfil dele com sua biografia (*Minha História*, *Inspirações* e *Técnicas e Materiais*), canais de venda e todo o acervo de obras em grade Pinterest.
- **Busca em Tempo Real & Filtros por Técnica**:
  - Busca por nome da peça, artesão ou técnica.
  - Filtros em chips/pílulas horizontais (*Todas*, *Azulejaria*, *Fibra de Buriti*, *Bordado de Bumba Boi*, *Cerâmica*, etc.).
- **Área do Produtor (Login / Cadastro / Publicação)**:
  - Cadastro simples e rápido para novos artesãos.
  - Publicação de novas peças com foto (com compressão automática para o limite do navegador) ou ilustrações procedurais artísticas como fallback.
  - Edição de perfil e gerenciamento de obras.

---

## 🚀 Como Rodar Localmente

Abra o arquivo `index.html` diretamente em qualquer navegador moderno (duplo clique) ou sirva a pasta com um servidor HTTP local:

```bash
npx http-server . -p 5173
```

Acesse: `http://localhost:5173`

---

## 👥 Contas de Demonstração (Artesãos de São Luís)

- **Maria da Graça Ferreira** (Azulejaria e Cerâmica · Centro Histórico): `maria@culturaemrede.com` · Senha: `123456`
- **Mestre Raimundo Nonato** (Fibra de Buriti e Cestaria · Madre Deus): `raimundo@culturaemrede.com` · Senha: `123456`
- **Dona Tereza de Jesus** (Bordadeira de Bumba Meu Boi · Monte Castelo): `tereza@culturaemrede.com` · Senha: `123456`
- **Ana Lúcia Raposo** (Rendeira de Bilro · Praia Grande): `ana@culturaemrede.com` · Senha: `123456`
- **José Ribamar Silva** (Xilogravurista e Escultor · Desterro): `jose@culturaemrede.com` · Senha: `123456`

---

## 💾 Armazenamento de Dados

Os dados são armazenados localmente no navegador via `localStorage` com módulo de persistência encapsulado:
- Na primeira visita, o sistema carrega os artesãos e obras de `js/data.js`.
- O botão *"Restaurar dados de exemplo"* (disponível na área de login ou através da API) restaura o acervo inicial de São Luís.
- Imagens enviadas pelo usuário são comprimidas via Canvas antes de serem salvas.

---

## 📁 Estrutura de Arquivos

```
Acervo-Vivo/
├── index.html      # Estrutura base da SPA
├── css/style.css   # Estilos Pinterest, paleta de São Luís, tipografia e responsividade
└── js/
    ├── data.js     # Artesãos de São Luís e obras de demonstração
    └── app.js      # Roteamento SPA, feed Pinterest, busca, modais e interações
```
