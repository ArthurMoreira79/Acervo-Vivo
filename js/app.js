/* =========================================================
   Acervo Vivo — aplicação (SPA sem dependências)

   Organização:
   1. Estado e persistência (localStorage)
   2. Utilitários
   3. Ilustrações geradas (para obras sem foto)
   4. Rotas
   5. Telas (login, cadastro, início, perfil)
   6. Componentes (post, modal, etc.)
   7. Eventos (cliques, formulários, uploads)
   ========================================================= */

(function () {
  'use strict';

  /* ---------- 1. Estado e persistência ---------- */

  const CHAVE = 'acervoVivo:v1';

  const TECNICAS = [
    'Cerâmica', 'Renda de bilro', 'Bordado', 'Cestaria', 'Xilogravura',
    'Tecelagem', 'Entalhe em madeira', 'Couro', 'Bonecas de pano', 'Trançado', 'Pintura'
  ];

  const CORES_AVATAR = ['#B5532F', '#2F4A6B', '#5B7553', '#9A6B1F', '#7A3E5C', '#3D6B6B'];

  const PALETAS = {
    ceramica: [['#F3E3CF', '#B5532F', '#2F4A6B'], ['#E9E4D6', '#5B7553', '#B5532F']],
    renda: [['#E9EEF3', '#2F4A6B', '#B5532F'], ['#F6EFE4', '#7A3E5C', '#2F4A6B']],
    bordado: [['#F6E7D7', '#7A3E5C', '#D9A441'], ['#EEF1E8', '#5B7553', '#B5532F']],
    cestaria: [['#F1E9D8', '#B5532F', '#D9A441'], ['#F1E9D8', '#5B7553', '#9A6B1F']],
    xilogravura: [['#F4ECDD', '#2B211B', '#B5532F']],
    tecelagem: [['#F3E3CF', '#2F4A6B', '#B5532F'], ['#F6EFE4', '#7A3E5C', '#D9A441']],
    madeira: [['#EADBC4', '#8F5A2B', '#5B3A1E']]
  };

  function copiaDados() {
    return JSON.parse(JSON.stringify(window.DADOS_INICIAIS));
  }

  function carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (bruto) {
        const dados = JSON.parse(bruto);
        if (dados && Array.isArray(dados.usuarios) && Array.isArray(dados.posts)) return dados;
      }
    } catch (e) { /* armazenamento indisponível: segue com os dados de exemplo */ }
    return copiaDados();
  }

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(db));
      return true;
    } catch (e) {
      aviso('Não foi possível salvar: o espaço do navegador acabou. Tente uma foto menor.', true);
      return false;
    }
  }

  let db = carregar();

  // Estado de interface (não é salvo)
  const ui = {
    filtro: 'Todas',
    comentariosAbertos: new Set(),
    editandoPerfil: false,
    imagemPendente: undefined, // undefined = não mexeu, null = remover, string = nova imagem
    avatarPendente: undefined,
    ultimaRota: null
  };

  const app = document.getElementById('app');
  const modalRaiz = document.getElementById('modal-raiz');

  function usuarioAtual() {
    return db.usuarios.find(u => u.id === db.sessao) || null;
  }

  function usuarioPorId(id) {
    return db.usuarios.find(u => u.id === id) || {
      id: id, nome: 'Artesão removido', oficio: '', cidade: '', cor: '#8A7A6D', avatar: null, sobre: {}, contato: {}
    };
  }

  /* ---------- 2. Utilitários ---------- */

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const novoId = prefixo => prefixo + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  function tempoRelativo(ts) {
    const seg = (ts - Date.now()) / 1000;
    const unidades = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [unidade, s] of unidades) {
      if (Math.abs(seg) >= s) return rtf.format(Math.round(seg / s), unidade);
    }
    return 'agora mesmo';
  }

  function dataLonga(ts) {
    return new Date(ts).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }

  function semAcento(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function iniciais(nome) {
    return String(nome || '?').trim().split(/\s+/).filter(p => p.length > 2 || /^[A-ZÁ-Ú]/.test(p))
      .slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
  }

  let timerAviso;
  function aviso(texto, erro) {
    const el = document.getElementById('toast');
    el.textContent = texto;
    el.classList.toggle('erro', !!erro);
    el.classList.add('visivel');
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => el.classList.remove('visivel'), 3200);
  }

  // Lê um arquivo de imagem e reduz o tamanho para caber no localStorage
  function lerImagem(arquivo, ladoMax) {
    return new Promise((resolve, reject) => {
      if (!arquivo.type.startsWith('image/')) return reject(new Error('O arquivo escolhido não é uma imagem.'));
      const leitor = new FileReader();
      leitor.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      leitor.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Formato de imagem não suportado.'));
        img.onload = () => {
          const escala = Math.min(1, ladoMax / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * escala);
          canvas.height = Math.round(img.height * escala);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = leitor.result;
      };
      leitor.readAsDataURL(arquivo);
    });
  }

  function linkInstagram(handle) {
    const limpo = String(handle || '').trim().replace(/^@/, '').replace(/[^\w.]/g, '');
    return limpo ? 'https://instagram.com/' + encodeURIComponent(limpo) : '';
  }

  function linkWhatsapp(numero) {
    const digitos = String(numero || '').replace(/\D/g, '');
    if (!digitos) return '';
    return 'https://wa.me/' + (digitos.length <= 11 ? '55' + digitos : digitos);
  }

  /* ---------- Ícones (SVG em linha) ---------- */

  const ICONES = {
    casa: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    sair: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 17l-5-5 5-5M5 12h11"/>',
    coracao: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    balao: '<path d="M4 5h16v11H9l-5 4z"/>',
    lapis: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    lixo: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    local: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
    imagem: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>',
    telefone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    livro: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
    brilho: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    mao: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 15.5L3 12a1.5 1.5 0 0 1 2.6-1.3L8 13"/>'
  };

  function icone(nome) {
    return '<svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONES[nome] + '</svg>';
  }

  const LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#B5532F"/>' +
    '<path d="M13 12h14l-2 4c4 3 4 10 0 13H15c-4-3-4-10 0-13z" fill="#FFF4EA"/>' +
    '<path d="M14 21h12M14.5 25h11" stroke="#B5532F" stroke-width="1.6"/><path d="M15 17h10" stroke="#D9A441" stroke-width="1.6"/></svg>';

  function avatar(u, tamanho) {
    const classe = 'avatar avatar-' + (tamanho || 'm');
    if (u.avatar) return '<img class="' + classe + '" src="' + esc(u.avatar) + '" alt="">';
    return '<span class="' + classe + '" style="--cor:' + esc(u.cor) + '" aria-hidden="true">' + esc(iniciais(u.nome)) + '</span>';
  }

  /* ---------- 3. Ilustrações geradas ---------- */

  function tipoDaTecnica(tecnica) {
    const t = semAcento(tecnica);
    if (/ceram|barro|argila|louca/.test(t)) return 'ceramica';
    if (/renda|bilro|croche|labirinto|file/.test(t)) return 'renda';
    if (/bord|ponto/.test(t)) return 'bordado';
    if (/cest|palha|tranc|vime|cipo|carnauba/.test(t)) return 'cestaria';
    if (/xilo|cordel|grav/.test(t)) return 'xilogravura';
    if (/tecel|tear|tapec|rede|tecido/.test(t)) return 'tecelagem';
    if (/madeira|entalhe|escult|marcen/.test(t)) return 'madeira';
    const tipos = Object.keys(PALETAS);
    let h = 0;
    for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return tipos[h % tipos.length];
  }

  function arteParaTecnica(tecnica) {
    const tipo = tipoDaTecnica(tecnica);
    const opcoes = PALETAS[tipo];
    return { tipo: tipo, cores: opcoes[Math.floor(Math.random() * opcoes.length)] };
  }

  function arte(a, rotulo) {
    const tipo = a && a.tipo || 'ceramica';
    const cores = (a && a.cores) || PALETAS.ceramica[0];
    const f = esc(cores[0]), c1 = esc(cores[1]), c2 = esc(cores[2]);
    const n = v => v.toFixed(1);
    let g = '';

    switch (tipo) {
      case 'renda': {
        g += '<circle cx="200" cy="130" r="14" fill="' + c1 + '"/>';
        [[40, 8, 10], [75, 14, 9], [110, 20, 8], [148, 28, 7], [190, 34, 7]].forEach(([r, qtd, cr], k) => {
          for (let i = 0; i < qtd; i++) {
            const ang = (i / qtd) * Math.PI * 2 + k * 0.2;
            g += '<circle cx="' + n(200 + r * Math.cos(ang)) + '" cy="' + n(130 + r * Math.sin(ang)) + '" r="' + cr +
              '" fill="none" stroke="' + (k % 2 ? c2 : c1) + '" stroke-width="2.5"/>';
          }
          g += '<circle cx="200" cy="130" r="' + r + '" fill="none" stroke="' + c1 + '" stroke-width="1" stroke-dasharray="3 5"/>';
        });
        break;
      }
      case 'cestaria': {
        for (let y = 0; y < 260; y += 26) {
          for (let x = 0; x < 400; x += 40) {
            const horizontal = ((x / 40) + (y / 26)) % 2 === 0;
            g += horizontal
              ? '<rect x="' + (x + 2) + '" y="' + (y + 8) + '" width="36" height="10" rx="5" fill="' + c1 + '"/>'
              : '<rect x="' + (x + 15) + '" y="' + (y + 1) + '" width="10" height="24" rx="5" fill="' + c2 + '"/>';
          }
        }
        break;
      }
      case 'bordado': {
        let linha = 0;
        for (let y = 45; y < 280; y += 80, linha++) {
          for (let x = (linha % 2 ? 0 : 50); x < 450; x += 100) {
            const cor = (x / 50 + linha) % 2 ? c1 : c2;
            for (let i = 0; i < 6; i++) {
              const ang = (i / 6) * Math.PI * 2;
              g += '<circle cx="' + n(x + 15 * Math.cos(ang)) + '" cy="' + n(y + 15 * Math.sin(ang)) + '" r="10" fill="' + cor + '" opacity=".9"/>';
            }
            g += '<circle cx="' + x + '" cy="' + y + '" r="7" fill="' + f + '" stroke="' + (cor === c1 ? c2 : c1) + '" stroke-width="3"/>';
            g += '<path d="M' + (x + 28) + ' ' + (y + 28) + ' q 12 -4 18 6" stroke="' + c1 + '" stroke-width="2" fill="none" stroke-dasharray="4 3"/>';
          }
        }
        break;
      }
      case 'xilogravura': {
        g += '<circle cx="200" cy="105" r="40" fill="' + c1 + '"/>';
        for (let i = 0; i < 18; i++) {
          const ang = (i / 18) * Math.PI * 2;
          g += '<path d="M' + n(200 + 52 * Math.cos(ang)) + ' ' + n(105 + 52 * Math.sin(ang)) + ' L' +
            n(200 + 86 * Math.cos(ang)) + ' ' + n(105 + 86 * Math.sin(ang)) + '" stroke="' + c1 + '" stroke-width="6" stroke-linecap="round"/>';
        }
        g += '<path d="M0 205 Q 90 160 190 200 T 400 190 V 260 H 0 Z" fill="' + c1 + '"/>';
        g += '<path d="M30 230 h60 M140 222 h80 M260 236 h70 M60 248 h50 M300 214 h40" stroke="' + f + '" stroke-width="3" stroke-linecap="round"/>';
        g += '<path d="M70 200 v-40 m0 14 h-10 v-12 m10 22 h10 v-16" stroke="' + c2 + '" stroke-width="6" stroke-linecap="round" fill="none"/>';
        g += '<path d="M330 196 v-34 m0 12 h-9 v-10 m9 18 h9 v-14" stroke="' + c2 + '" stroke-width="6" stroke-linecap="round" fill="none"/>';
        break;
      }
      case 'tecelagem': {
        const faixas = [18, 8, 26, 6, 14, 30, 8, 18, 10, 24, 6, 16, 22, 14, 20, 20];
        let y = 0;
        faixas.forEach((alt, i) => {
          const cor = [c1, c2, f, c1][i % 4];
          g += '<rect x="0" y="' + y + '" width="400" height="' + alt + '" fill="' + cor + '"/>';
          y += alt;
        });
        for (let x = 0; x < 400; x += 24) {
          g += '<path d="M' + x + ' 120 l12 -14 l12 14 z" fill="' + f + '"/><path d="M' + x + ' 120 l12 14 l12 -14 z" fill="' + c2 + '"/>';
        }
        break;
      }
      case 'madeira': {
        for (let i = 12; i >= 1; i--) {
          g += '<ellipse cx="190" cy="130" rx="' + (i * 26) + '" ry="' + (i * 13) + '" fill="none" stroke="' + (i % 3 ? c1 : c2) + '" stroke-width="' + (i % 3 ? 2 : 4) + '"/>';
        }
        g += '<ellipse cx="190" cy="130" rx="10" ry="6" fill="' + c2 + '"/>';
        break;
      }
      default: { // cerâmica
        g += '<ellipse cx="200" cy="228" rx="120" ry="12" fill="' + c1 + '" opacity=".18"/>';
        g += '<path d="M168 40 H232 L226 62 C282 92 290 176 248 222 H152 C110 176 118 92 174 62 Z" fill="' + c1 + '"/>';
        g += '<path d="M162 40 H238" stroke="' + c1 + '" stroke-width="10" stroke-linecap="round"/>';
        g += '<path d="M146 112 H254 M138 160 H262" stroke="' + c2 + '" stroke-width="6"/>';
        let zig = 'M142 136';
        for (let x = 142, i = 0; x <= 258; x += 12, i++) zig += ' L' + x + ' ' + (i % 2 ? 128 : 144);
        g += '<path d="' + zig + '" stroke="' + f + '" stroke-width="4" fill="none" stroke-linejoin="round"/>';
        g += '<circle cx="200" cy="190" r="8" fill="' + f + '"/><circle cx="174" cy="190" r="5" fill="' + f + '"/><circle cx="226" cy="190" r="5" fill="' + f + '"/>';
      }
    }

    const acessivel = rotulo ? 'role="img" aria-label="' + esc(rotulo) + '"' : 'aria-hidden="true"';
    return '<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" ' + acessivel + '>' +
      '<rect width="400" height="260" fill="' + f + '"/>' + g + '</svg>';
  }

  function arteDoUsuario(u) {
    const tipo = tipoDaTecnica(u.oficio);
    return { tipo: tipo, cores: PALETAS[tipo][0] };
  }

  /* ---------- 4. Rotas ---------- */

  function irPara(hash) {
    if (location.hash === hash) renderizar();
    else location.hash = hash;
  }

  function trocarRota(hash) {
    history.replaceState(null, '', hash);
  }

  function renderizar() {
    const partes = location.hash.replace(/^#\/?/, '').split('/');
    const pagina = partes[0];
    const param = partes[1];
    const eu = usuarioAtual();
    let html;
    let rota;

    if (!eu) {
      if (pagina === 'cadastro') { rota = 'cadastro'; html = telaCadastro(); }
      else { if (pagina !== 'login') trocarRota('#/login'); rota = 'login'; html = telaLogin(); }
    } else if (pagina === 'perfil') {
      rota = 'perfil'; html = casca(telaPerfil(eu, eu), 'perfil');
    } else if (pagina === 'artesao' && param) {
      const alvo = db.usuarios.find(u => u.id === param);
      if (alvo && alvo.id === eu.id) { trocarRota('#/perfil'); rota = 'perfil'; html = casca(telaPerfil(eu, eu), 'perfil'); }
      else if (alvo) { rota = 'artesao/' + alvo.id; html = casca(telaPerfil(alvo, eu), 'artesao'); }
    }

    if (!html) {
      if (pagina !== 'inicio') trocarRota('#/inicio');
      rota = 'inicio';
      html = casca(telaInicio(eu), 'inicio');
    }

    if (rota !== ui.ultimaRota) {
      ui.editandoPerfil = false;
      ui.avatarPendente = undefined;
    }
    app.innerHTML = html;
    if (rota !== ui.ultimaRota) {
      window.scrollTo(0, 0);
      const titulos = { login: 'Entrar', cadastro: 'Criar conta', inicio: 'Início', perfil: 'Meu perfil' };
      document.title = (titulos[rota] || (rota.startsWith('artesao') ? usuarioPorId(param).nome : '')) + ' · Acervo Vivo';
    }
    ui.ultimaRota = rota;
  }

  /* ---------- 5. Telas ---------- */

  function painelArte(titulo, texto) {
    return '<section class="entrada-arte">' +
      '<div class="fundo">' + arte({ tipo: 'renda', cores: ['#8F3D1F', '#FFF4EA', '#D9A441'] }) + '</div>' +
      '<a class="marca" href="#/login">' + LOGO + '<span>Acervo Vivo</span></a>' +
      '<div><h1>' + titulo + '</h1><p>' + texto + '</p></div>' +
      '<p class="rodape-arte">Uma rede para quem faz cultura com as próprias mãos.</p>' +
      '</section>';
  }

  function telaLogin() {
    return '<div class="entrada">' +
      painelArte('Cada peça guarda uma história.', 'Mostre seu ofício, conte sua trajetória e conheça artesãos de todo o Brasil.') +
      '<section class="entrada-form"><div class="caixa">' +
      '<h2>Entrar</h2><p class="sub">Que bom ter você de volta.</p>' +
      '<form data-form="login" novalidate>' +
      '<div class="campo"><label for="login-email">E-mail</label><input id="login-email" name="email" type="email" autocomplete="email" required></div>' +
      '<div class="campo"><label for="login-senha">Senha</label><input id="login-senha" name="senha" type="password" autocomplete="current-password" required></div>' +
      '<p class="erro-form" role="alert"></p>' +
      '<button class="btn btn-bloco" type="submit">Entrar</button>' +
      '</form>' +
      '<p class="alternar">Ainda não tem conta? <a href="#/cadastro">Criar conta</a></p>' +
      '<div class="demo"><strong>Conta de demonstração</strong><br>maria@acervovivo.com · senha 123456' +
      '<br><button type="button" class="btn-texto" data-acao="preencher-demo">Preencher automaticamente</button></div>' +
      '</div></section></div>';
  }

  function telaCadastro() {
    return '<div class="entrada">' +
      painelArte('Seu ofício merece ser visto.', 'Crie seu perfil de artesão e compartilhe suas obras, técnicas e inspirações.') +
      '<section class="entrada-form"><div class="caixa">' +
      '<h2>Criar conta</h2><p class="sub">Leva menos de um minuto.</p>' +
      '<form data-form="cadastro" novalidate>' +
      '<div class="campo"><label for="cad-nome">Nome completo</label><input id="cad-nome" name="nome" autocomplete="name" required maxlength="80"></div>' +
      '<div class="linha-campos">' +
      '<div class="campo"><label for="cad-oficio">Ofício</label><input id="cad-oficio" name="oficio" list="lista-tecnicas" placeholder="Ex.: Ceramista" required maxlength="60"></div>' +
      '<div class="campo"><label for="cad-cidade">Cidade / UF</label><input id="cad-cidade" name="cidade" placeholder="Ex.: Olinda, PE" maxlength="60"></div>' +
      '</div>' +
      '<div class="campo"><label for="cad-email">E-mail</label><input id="cad-email" name="email" type="email" autocomplete="email" required></div>' +
      '<div class="campo"><label for="cad-senha">Senha</label><input id="cad-senha" name="senha" type="password" autocomplete="new-password" required minlength="6"><span class="dica">Mínimo de 6 caracteres.</span></div>' +
      '<p class="erro-form" role="alert"></p>' +
      '<button class="btn btn-bloco" type="submit">Criar conta e entrar</button>' +
      '</form>' +
      '<p class="alternar">Já tem conta? <a href="#/login">Entrar</a></p>' +
      '</div></section></div>';
  }

  function casca(conteudo, ativo) {
    const eu = usuarioAtual();
    const atual = nome => ativo === nome ? ' aria-current="page"' : '';
    return '<header class="topo"><div class="topo-interno">' +
      '<a class="marca" href="#/inicio">' + LOGO + '<span>Acervo Vivo</span></a>' +
      '<nav class="nav" aria-label="Principal">' +
      '<a href="#/inicio"' + atual('inicio') + '>' + icone('casa') + '<span class="rotulo">Início</span></a>' +
      '<a href="#/perfil"' + atual('perfil') + '>' + icone('pessoa') + '<span class="rotulo">Meu perfil</span></a>' +
      '</nav>' +
      '<div class="topo-usuario">' + avatar(eu, 'p') +
      '<button class="btn-texto" data-acao="sair" title="Sair">' + icone('sair') + '<span class="rotulo visualmente-oculto">Sair</span></button>' +
      '</div>' +
      '</div></header>' +
      '<main class="conteudo" id="conteudo">' + conteudo + '</main>';
  }

  function postsOrdenados(filtroFn) {
    return db.posts.filter(filtroFn || (() => true)).sort((a, b) => b.criadoEm - a.criadoEm);
  }

  function curtidasRecebidas(u) {
    return db.posts.filter(p => p.autorId === u.id).reduce((t, p) => t + p.curtidas.length, 0);
  }

  function telaInicio(eu) {
    const meusPosts = db.posts.filter(p => p.autorId === eu.id).length;

    const tecnicasUsadas = [...new Set(db.posts.map(p => p.tecnica).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (ui.filtro !== 'Todas' && !tecnicasUsadas.includes(ui.filtro)) ui.filtro = 'Todas';
    const chips = ['Todas'].concat(tecnicasUsadas).map(t =>
      '<button class="chip" data-acao="filtrar" data-valor="' + esc(t) + '" aria-pressed="' + (ui.filtro === t) + '">' + esc(t) + '</button>'
    ).join('');

    const lista = postsOrdenados(p => ui.filtro === 'Todas' || p.tecnica === ui.filtro);
    const feed = lista.length
      ? lista.map(p => cartaoPost(p, eu)).join('')
      : '<div class="cartao vazio"><h3>Nada por aqui ainda</h3><p>Seja a primeira pessoa a compartilhar uma obra' +
        (ui.filtro !== 'Todas' ? ' de ' + esc(ui.filtro) : '') + '.</p>' +
        '<button class="btn" data-acao="nova-obra">' + icone('mais') + 'Compartilhar obra</button></div>';

    const outros = db.usuarios.filter(u => u.id !== eu.id)
      .map(u => ({ u: u, n: db.posts.filter(p => p.autorId === u.id).length }))
      .sort((a, b) => b.n - a.n).slice(0, 6);

    return '<div class="grade-inicio">' +
      '<aside class="col-esquerda col-lateral" aria-label="Seu perfil">' +
        '<div class="cartao mini-perfil">' +
          '<div class="capa">' + arte(arteDoUsuario(eu)) + '</div>' +
          avatar(eu, 'm') +
          '<div class="nome">' + esc(eu.nome) + '</div>' +
          '<div class="oficio">' + esc(eu.oficio || 'Artesão') + (eu.cidade ? ' · ' + esc(eu.cidade) : '') + '</div>' +
          '<div class="numeros"><div><strong>' + meusPosts + '</strong><span>obras</span></div>' +
          '<div><strong>' + curtidasRecebidas(eu) + '</strong><span>curtidas</span></div></div>' +
          '<div class="acao"><a class="btn btn-sec btn-bloco" href="#/perfil">Ver meu perfil</a></div>' +
        '</div>' +
        '<div class="cartao cartao-corpo">' +
          '<h2 class="cartao-titulo">Sobre o Acervo Vivo</h2>' +
          '<p class="texto-pequeno">Um espaço para dar visibilidade ao trabalho artesanal e manter viva a cultura que passa de mão em mão.</p>' +
          '<button class="btn-texto" data-acao="restaurar" style="margin-top:.6rem;padding-left:0;font-size:.85rem">Restaurar dados de exemplo</button>' +
        '</div>' +
      '</aside>' +

      '<section class="feed" aria-label="Publicações">' +
        '<div class="cartao compor">' + avatar(eu, 'm') +
          '<button class="abrir" data-acao="nova-obra">Compartilhe uma obra, um processo, uma história…</button>' +
        '</div>' +
        '<div class="filtros" role="group" aria-label="Filtrar por técnica">' + chips + '</div>' +
        feed +
      '</section>' +

      '<aside class="col-direita col-lateral" aria-label="Artesãos">' +
        '<div class="cartao cartao-corpo">' +
          '<h2 class="cartao-titulo">Artesãos para conhecer</h2>' +
          (outros.length ? '<ul class="lista-artesaos">' + outros.map(({ u, n }) =>
            '<li>' + avatar(u, 'm') + '<div><a href="#/artesao/' + esc(u.id) + '">' + esc(u.nome) + '</a>' +
            '<div class="meta">' + esc(u.oficio || 'Artesão') + '</div>' +
            '<div class="meta">' + (u.cidade ? esc(u.cidade) + ' · ' : '') + plural(n, 'obra', 'obras') + '</div></div></li>'
          ).join('') + '</ul>' : '<p class="texto-pequeno">Quando outros artesãos entrarem, eles aparecem aqui.</p>') +
        '</div>' +
      '</aside>' +
      '</div>';
  }

  function blocoSobre(icon, titulo, texto, ehMeu, dicaVazio) {
    const conteudo = texto
      ? '<p>' + esc(texto) + '</p>'
      : '<p class="pendente">' + (ehMeu ? dicaVazio : 'Ainda não foi preenchido.') + '</p>';
    return '<div class="sobre-bloco"><h3>' + icone(icon) + titulo + '</h3>' + conteudo + '</div>';
  }

  function telaPerfil(u, eu) {
    const ehMeu = u.id === eu.id;
    const sobre = u.sobre || {};
    const contato = u.contato || {};
    const obras = postsOrdenados(p => p.autorId === u.id);

    const botoes = ehMeu
      ? '<button class="btn btn-sec" data-acao="editar-perfil">' + icone('lapis') + 'Editar perfil</button>' +
        '<button class="btn" data-acao="nova-obra">' + icone('mais') + 'Nova obra</button>'
      : (linkWhatsapp(contato.whatsapp)
          ? '<a class="btn" href="' + esc(linkWhatsapp(contato.whatsapp)) + '" target="_blank" rel="noopener">' + icone('telefone') + 'Conversar</a>'
          : '') +
        (linkInstagram(contato.instagram)
          ? '<a class="btn btn-sec" href="' + esc(linkInstagram(contato.instagram)) + '" target="_blank" rel="noopener">' + icone('instagram') + 'Instagram</a>'
          : '');

    const topo = '<div class="cartao perfil-topo">' +
      '<div class="perfil-capa">' + arte(arteDoUsuario(u)) + '</div>' +
      '<div class="perfil-id">' + avatar(u, 'g') +
        '<div class="info">' +
          '<h1>' + esc(u.nome) + '</h1>' +
          '<p class="oficio">' + esc(u.oficio || 'Artesão') + '</p>' +
          (u.cidade ? '<div class="local">' + icone('local') + esc(u.cidade) + '</div>' : '') +
          '<div class="perfil-numeros"><span><strong>' + obras.length + '</strong> ' + (obras.length === 1 ? 'obra' : 'obras') + '</span>' +
          '<span><strong>' + curtidasRecebidas(u) + '</strong> curtidas recebidas</span></div>' +
        '</div>' +
        '<div class="botoes">' + botoes + '</div>' +
      '</div></div>';

    const secaoSobre = (ehMeu && ui.editandoPerfil)
      ? formularioPerfil(u)
      : '<section class="cartao cartao-corpo sobre" aria-labelledby="titulo-sobre">' +
          '<h2 id="titulo-sobre">Sobre mim</h2>' +
          blocoSobre('livro', 'Minha história', sobre.historia, ehMeu, 'Conte como você começou no ofício, quem te ensinou e o que sua arte significa para você.') +
          blocoSobre('brilho', 'Inspirações', sobre.inspiracoes, ehMeu, 'O que te inspira? Lugares, pessoas, tradições, a natureza…') +
          blocoSobre('mao', 'Técnicas e materiais', sobre.tecnicas, ehMeu, 'Quais materiais e técnicas você usa? Como é o seu processo?') +
          (ehMeu && !sobre.historia ? '<p style="margin:1.25rem 0 0"><button class="btn btn-sec" data-acao="editar-perfil">' + icone('lapis') + 'Escrever minha história</button></p>' : '') +
        '</section>';

    const listaObras = obras.length
      ? obras.map(p => cartaoPost(p, eu)).join('')
      : '<div class="cartao vazio"><h3>' + (ehMeu ? 'Você ainda não publicou obras' : 'Nenhuma obra publicada ainda') + '</h3>' +
        (ehMeu ? '<p>Mostre uma peça que você fez e conte a história dela.</p><button class="btn" data-acao="nova-obra">' + icone('mais') + 'Publicar primeira obra</button>' : '') +
        '</div>';

    const itensContato = [];
    if (u.cidade) itensContato.push('<li>' + icone('local') + esc(u.cidade) + '</li>');
    if (linkInstagram(contato.instagram)) itensContato.push('<li>' + icone('instagram') + '<a href="' + esc(linkInstagram(contato.instagram)) + '" target="_blank" rel="noopener">' + esc(contato.instagram) + '</a></li>');
    if (linkWhatsapp(contato.whatsapp)) itensContato.push('<li>' + icone('telefone') + '<a href="' + esc(linkWhatsapp(contato.whatsapp)) + '" target="_blank" rel="noopener">' + esc(contato.whatsapp) + '</a></li>');
    itensContato.push('<li>' + icone('calendario') + 'No Acervo Vivo desde ' + esc(dataLonga(u.criadoEm || Date.now())) + '</li>');

    const lateral = '<aside class="lateral">' +
      '<div class="cartao cartao-corpo"><h2 class="cartao-titulo">Contato</h2><ul class="contatos">' + itensContato.join('') + '</ul>' +
      (ehMeu && !contato.instagram && !contato.whatsapp ? '<p class="texto-pequeno" style="margin-top:.85rem">Adicione Instagram ou WhatsApp para que interessados falem com você.</p>' : '') +
      '</div>' +
      (!ehMeu ? '<a class="btn btn-sec btn-bloco" href="#/inicio">Voltar ao início</a>' : '') +
      '</aside>';

    return '<div class="perfil">' + topo +
      '<div class="grade-perfil"><div class="principal">' + secaoSobre +
      '<div class="titulo-secao"><h2>' + (ehMeu ? 'Minhas obras' : 'Obras') + '</h2></div>' +
      listaObras + '</div>' + lateral + '</div></div>';
  }

  function formularioPerfil(u) {
    const s = u.sobre || {};
    const c = u.contato || {};
    const avatarPrevia = ui.avatarPendente === undefined ? u : Object.assign({}, u, { avatar: ui.avatarPendente });
    return '<section class="cartao cartao-corpo editar-perfil" aria-labelledby="titulo-editar">' +
      '<h2 id="titulo-editar">Editar perfil</h2>' +
      '<form data-form="perfil" novalidate>' +
      '<div class="editor-avatar"><div id="previa-avatar">' + avatar(avatarPrevia, 'm') + '</div>' +
        '<div class="botoes">' +
        '<label class="btn btn-sec btn-arquivo">' + icone('imagem') + 'Trocar foto<input type="file" accept="image/*" data-imagem="avatar" aria-label="Escolher foto de perfil"></label>' +
        (avatarPrevia.avatar ? '<button type="button" class="btn-texto" data-acao="remover-avatar">Remover foto</button>' : '') +
        '</div></div>' +

      '<fieldset><legend>Identificação</legend>' +
        '<div class="campo"><label for="pf-nome">Nome</label><input id="pf-nome" name="nome" value="' + esc(u.nome) + '" required maxlength="80"></div>' +
        '<div class="linha-campos">' +
        '<div class="campo"><label for="pf-oficio">Ofício</label><input id="pf-oficio" name="oficio" list="lista-tecnicas" value="' + esc(u.oficio) + '" maxlength="60"></div>' +
        '<div class="campo"><label for="pf-cidade">Cidade / UF</label><input id="pf-cidade" name="cidade" value="' + esc(u.cidade) + '" maxlength="60"></div>' +
        '</div></fieldset>' +

      '<fieldset><legend>Sobre mim</legend>' +
        '<div class="campo"><label for="pf-historia">Minha história</label><textarea id="pf-historia" name="historia" rows="6" maxlength="3000" placeholder="Como você começou? Quem te ensinou? O que sua arte representa?">' + esc(s.historia) + '</textarea></div>' +
        '<div class="campo"><label for="pf-inspiracoes">Inspirações</label><textarea id="pf-inspiracoes" name="inspiracoes" rows="3" maxlength="1500" placeholder="Lugares, pessoas, tradições, festas, a natureza…">' + esc(s.inspiracoes) + '</textarea></div>' +
        '<div class="campo"><label for="pf-tecnicas">Técnicas e materiais</label><textarea id="pf-tecnicas" name="tecnicas" rows="3" maxlength="1500" placeholder="Materiais que usa, etapas do processo, ferramentas…">' + esc(s.tecnicas) + '</textarea></div>' +
      '</fieldset>' +

      '<fieldset><legend>Contato</legend>' +
        '<div class="linha-campos">' +
        '<div class="campo"><label for="pf-insta">Instagram</label><input id="pf-insta" name="instagram" value="' + esc(c.instagram) + '" placeholder="@seuperfil" maxlength="40"></div>' +
        '<div class="campo"><label for="pf-zap">WhatsApp</label><input id="pf-zap" name="whatsapp" type="tel" value="' + esc(c.whatsapp) + '" placeholder="(81) 99999-9999" maxlength="20"></div>' +
        '</div></fieldset>' +

      '<p class="erro-form" role="alert"></p>' +
      '<div class="acoes"><button type="button" class="btn btn-sec" data-acao="cancelar-perfil">Cancelar</button>' +
      '<button type="submit" class="btn">Salvar alterações</button></div>' +
      '</form></section>';
  }

  /* ---------- 6. Componentes ---------- */

  function cartaoPost(p, eu) {
    const autor = usuarioPorId(p.autorId);
    const ehMeu = p.autorId === eu.id;
    const curtiu = p.curtidas.includes(eu.id);
    const aberto = ui.comentariosAbertos.has(p.id);
    const nComent = p.comentarios.length;

    const midia = p.imagem
      ? '<div class="post-midia"><img src="' + esc(p.imagem) + '" alt="Foto da obra ' + esc(p.titulo) + '" loading="lazy"></div>'
      : '<div class="post-midia">' + arte(p.arte || arteParaTecnica(p.tecnica), 'Ilustração decorativa de ' + (p.tecnica || 'artesanato')) + '</div>';

    const acoesAutor = ehMeu
      ? '<div class="post-acoes-autor">' +
        '<button class="btn-icone" data-acao="editar-obra" data-id="' + esc(p.id) + '" title="Editar obra" aria-label="Editar obra">' + icone('lapis') + '</button>' +
        '<button class="btn-icone" data-acao="excluir-obra" data-id="' + esc(p.id) + '" title="Excluir obra" aria-label="Excluir obra">' + icone('lixo') + '</button>' +
        '</div>'
      : '';

    const comentarios = aberto
      ? '<div class="comentarios">' +
        p.comentarios.map(c => {
          const a = usuarioPorId(c.autorId);
          return '<div class="comentario">' + avatar(a, 'p') + '<div class="balao">' +
            '<a href="#/artesao/' + esc(a.id) + '">' + esc(a.nome) + '</a><span class="quando">' + esc(tempoRelativo(c.criadoEm)) + '</span>' +
            '<p>' + esc(c.texto) + '</p></div></div>';
        }).join('') +
        '<form class="form-comentario" data-form="comentar" data-id="' + esc(p.id) + '">' + avatar(eu, 'p') +
        '<label class="visualmente-oculto" for="com-' + esc(p.id) + '">Escreva um comentário</label>' +
        '<input id="com-' + esc(p.id) + '" name="texto" placeholder="Escreva um comentário…" maxlength="500" autocomplete="off" required>' +
        '<button class="btn" type="submit">Enviar</button></form>' +
        '</div>'
      : '';

    return '<article class="cartao post" id="post-' + esc(p.id) + '">' +
      '<header class="post-cabecalho">' + avatar(autor, 'm') +
        '<div class="post-autor">' +
          '<a class="nome" href="#/artesao/' + esc(autor.id) + '">' + esc(autor.nome) + '</a>' +
          '<div class="meta">' + esc(autor.oficio || 'Artesão') + (autor.cidade ? ' · ' + esc(autor.cidade) : '') + '</div>' +
          '<div class="meta">' + esc(tempoRelativo(p.criadoEm)) + (p.editadoEm ? ' · editado' : '') + '</div>' +
        '</div>' + acoesAutor +
      '</header>' +
      '<div class="post-texto"><h3>' + esc(p.titulo) + '</h3><p>' + esc(p.descricao) + '</p>' +
        (p.tecnica ? '<button class="etiqueta" data-acao="filtrar" data-valor="' + esc(p.tecnica) + '" title="Ver mais obras de ' + esc(p.tecnica) + '">#' + esc(p.tecnica) + '</button>' : '') +
      '</div>' +
      midia +
      '<footer class="post-rodape">' +
        '<button class="btn-reacao" data-acao="curtir" data-id="' + esc(p.id) + '" aria-pressed="' + curtiu + '">' + icone('coracao') + (curtiu ? 'Curtido' : 'Curtir') + '</button>' +
        '<button class="btn-reacao" data-acao="comentarios" data-id="' + esc(p.id) + '" aria-expanded="' + aberto + '">' + icone('balao') + 'Comentar</button>' +
        '<span class="contagem">' + plural(p.curtidas.length, 'curtida', 'curtidas') + ' · ' + plural(nComent, 'comentário', 'comentários') + '</span>' +
      '</footer>' + comentarios +
      '</article>';
  }

  function previaObra(imagem) {
    return imagem
      ? '<img src="' + esc(imagem) + '" alt="Prévia da foto">'
      : '<div class="sem-foto">Sem foto? Tudo bem — a obra ganha uma ilustração inspirada na técnica.</div>';
  }

  function abrirModalObra(id) {
    const p = id ? db.posts.find(x => x.id === id) : null;
    if (id && !p) return;
    ui.imagemPendente = undefined;
    const imagem = p ? p.imagem : null;

    modalRaiz.innerHTML =
      '<div class="modal-fundo" data-acao="fechar-modal-fundo">' +
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">' +
      '<div class="modal-cabecalho"><h2 id="modal-titulo">' + (p ? 'Editar obra' : 'Compartilhar uma obra') + '</h2>' +
      '<button class="btn-icone" data-acao="fechar-modal" aria-label="Fechar">' + icone('fechar') + '</button></div>' +
      '<form data-form="obra" data-id="' + esc(p ? p.id : '') + '" novalidate>' +
      '<div class="modal-corpo">' +
        '<div class="campo"><label for="ob-titulo">Título</label><input id="ob-titulo" name="titulo" required maxlength="100" value="' + esc(p ? p.titulo : '') + '" placeholder="Ex.: Vaso de barro com pintura de terra"></div>' +
        '<div class="campo"><label for="ob-tecnica">Técnica</label><input id="ob-tecnica" name="tecnica" list="lista-tecnicas" required maxlength="40" value="' + esc(p ? p.tecnica : '') + '" placeholder="Escolha ou escreva"></div>' +
        '<div class="campo"><label for="ob-descricao">Descrição</label><textarea id="ob-descricao" name="descricao" rows="6" required maxlength="3000" placeholder="Conte sobre a peça: materiais, tempo de feitura, a história por trás dela…">' + esc(p ? p.descricao : '') + '</textarea></div>' +
        '<div class="campo"><span id="rotulo-foto" style="font-weight:600;font-size:.95rem">Foto da obra <span style="font-weight:400;color:var(--tinta-3)">(opcional)</span></span>' +
          '<div class="upload" aria-labelledby="rotulo-foto">' +
            '<div class="previa" id="previa-obra">' + previaObra(imagem) + '</div>' +
            '<div class="botoes">' +
              '<label class="btn btn-sec btn-arquivo">' + icone('imagem') + '<span id="txt-foto">' + (imagem ? 'Trocar foto' : 'Escolher foto') + '</span><input type="file" accept="image/*" data-imagem="obra" aria-label="Escolher foto da obra"></label>' +
              '<button type="button" class="btn-texto" data-acao="remover-foto-obra"' + (imagem ? '' : ' hidden') + '>Remover foto</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<p class="erro-form" role="alert"></p>' +
      '</div>' +
      '<div class="modal-rodape"><button type="button" class="btn btn-sec" data-acao="fechar-modal">Cancelar</button>' +
      '<button type="submit" class="btn">' + (p ? 'Salvar' : 'Publicar') + '</button></div>' +
      '</form></div></div>';

    document.body.style.overflow = 'hidden';
    setTimeout(() => { const el = document.getElementById('ob-titulo'); if (el) el.focus(); }, 30);
  }

  function fecharModal() {
    if (!modalRaiz.innerHTML) return;
    modalRaiz.innerHTML = '';
    document.body.style.overflow = '';
    ui.imagemPendente = undefined;
  }

  function atualizarPreviaObra(imagem) {
    const previa = document.getElementById('previa-obra');
    if (previa) previa.innerHTML = previaObra(imagem);
    const remover = modalRaiz.querySelector('[data-acao="remover-foto-obra"]');
    if (remover) remover.hidden = !imagem;
    const txt = document.getElementById('txt-foto');
    if (txt) txt.textContent = imagem ? 'Trocar foto' : 'Escolher foto';
  }

  /* ---------- 7. Eventos ---------- */

  function mostrarErro(form, msg) {
    const el = form.querySelector('.erro-form');
    if (el) el.textContent = msg;
  }

  const acoes = {
    'sair'() {
      db.sessao = null;
      salvar();
      ui.comentariosAbertos.clear();
      ui.filtro = 'Todas';
      irPara('#/login');
    },
    'preencher-demo'() {
      document.getElementById('login-email').value = 'maria@acervovivo.com';
      document.getElementById('login-senha').value = '123456';
    },
    'restaurar'() {
      if (!confirm('Isso apaga todas as contas e publicações criadas neste navegador e volta aos dados de exemplo. Continuar?')) return;
      db = copiaDados();
      salvar();
      ui.comentariosAbertos.clear();
      irPara('#/login');
      aviso('Dados de exemplo restaurados.');
    },
    'filtrar'(el) {
      ui.filtro = el.dataset.valor || 'Todas';
      if (location.hash !== '#/inicio') irPara('#/inicio');
      else renderizar();
    },
    'nova-obra'() { abrirModalObra(null); },
    'editar-obra'(el) { abrirModalObra(el.dataset.id); },
    'excluir-obra'(el) {
      const p = db.posts.find(x => x.id === el.dataset.id);
      if (!p || p.autorId !== db.sessao) return;
      if (!confirm('Excluir a obra "' + p.titulo + '"? Esta ação não pode ser desfeita.')) return;
      db.posts = db.posts.filter(x => x.id !== p.id);
      salvar();
      renderizar();
      aviso('Obra excluída.');
    },
    'curtir'(el) {
      const p = db.posts.find(x => x.id === el.dataset.id);
      if (!p) return;
      const i = p.curtidas.indexOf(db.sessao);
      if (i >= 0) p.curtidas.splice(i, 1); else p.curtidas.push(db.sessao);
      salvar();
      renderizar();
    },
    'comentarios'(el) {
      const id = el.dataset.id;
      if (ui.comentariosAbertos.has(id)) ui.comentariosAbertos.delete(id);
      else ui.comentariosAbertos.add(id);
      renderizar();
      const input = document.getElementById('com-' + id);
      if (input) input.focus();
    },
    'fechar-modal'() { fecharModal(); },
    'fechar-modal-fundo'(el, e) { if (e.target === el) fecharModal(); },
    'remover-foto-obra'() {
      ui.imagemPendente = null;
      atualizarPreviaObra(null);
    },
    'editar-perfil'() {
      ui.editandoPerfil = true;
      ui.avatarPendente = undefined;
      renderizar();
      const form = document.querySelector('[data-form="perfil"]');
      if (form) {
        form.closest('section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => document.getElementById('pf-nome').focus({ preventScroll: true }), 300);
      }
    },
    'cancelar-perfil'() {
      ui.editandoPerfil = false;
      ui.avatarPendente = undefined;
      renderizar();
    },
    'remover-avatar'() {
      ui.avatarPendente = null;
      atualizarPreviaAvatar();
    }
  };

  function atualizarPreviaAvatar() {
    const eu = usuarioAtual();
    const previa = Object.assign({}, eu, { avatar: ui.avatarPendente === undefined ? eu.avatar : ui.avatarPendente });
    const alvo = document.getElementById('previa-avatar');
    if (alvo) alvo.innerHTML = avatar(previa, 'm');
    const botoes = document.querySelector('.editor-avatar .botoes');
    const remover = botoes && botoes.querySelector('[data-acao="remover-avatar"]');
    if (previa.avatar && !remover && botoes) {
      botoes.insertAdjacentHTML('beforeend', '<button type="button" class="btn-texto" data-acao="remover-avatar">Remover foto</button>');
    } else if (!previa.avatar && remover) {
      remover.remove();
    }
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-acao]');
    if (!el) return;
    const fn = acoes[el.dataset.acao];
    if (fn) fn(el, e);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModal();
  });

  document.addEventListener('change', async e => {
    const input = e.target.closest('input[type="file"][data-imagem]');
    if (!input || !input.files || !input.files[0]) return;
    const tipo = input.dataset.imagem;
    try {
      const url = await lerImagem(input.files[0], tipo === 'avatar' ? 400 : 1200);
      if (tipo === 'avatar') {
        ui.avatarPendente = url;
        atualizarPreviaAvatar();
      } else {
        ui.imagemPendente = url;
        atualizarPreviaObra(url);
      }
    } catch (err) {
      aviso(err.message, true);
    } finally {
      input.value = '';
    }
  });

  const formularios = {
    login(form, d) {
      const email = String(d.email || '').trim().toLowerCase();
      const u = db.usuarios.find(x => x.email.toLowerCase() === email && x.senha === d.senha);
      if (!email || !d.senha) return mostrarErro(form, 'Preencha e-mail e senha.');
      if (!u) return mostrarErro(form, 'E-mail ou senha incorretos.');
      db.sessao = u.id;
      salvar();
      irPara('#/inicio');
      aviso('Bem-vindo(a), ' + u.nome.split(' ')[0] + '!');
    },

    cadastro(form, d) {
      const nome = String(d.nome || '').trim();
      const email = String(d.email || '').trim().toLowerCase();
      const oficio = String(d.oficio || '').trim();
      if (!nome || !email || !oficio || !d.senha) return mostrarErro(form, 'Preencha nome, ofício, e-mail e senha.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return mostrarErro(form, 'Digite um e-mail válido.');
      if (d.senha.length < 6) return mostrarErro(form, 'A senha precisa ter pelo menos 6 caracteres.');
      if (db.usuarios.some(u => u.email.toLowerCase() === email)) return mostrarErro(form, 'Já existe uma conta com este e-mail.');

      const u = {
        id: novoId('u'),
        nome: nome,
        email: email,
        senha: d.senha,
        oficio: oficio,
        cidade: String(d.cidade || '').trim(),
        cor: CORES_AVATAR[db.usuarios.length % CORES_AVATAR.length],
        avatar: null,
        sobre: { historia: '', inspiracoes: '', tecnicas: '' },
        contato: { instagram: '', whatsapp: '' },
        criadoEm: Date.now()
      };
      db.usuarios.push(u);
      db.sessao = u.id;
      if (!salvar()) return;
      irPara('#/inicio');
      aviso('Conta criada! Conte sua história em "Meu perfil".');
    },

    obra(form, d) {
      const titulo = String(d.titulo || '').trim();
      const tecnica = String(d.tecnica || '').trim();
      const descricao = String(d.descricao || '').trim();
      if (!titulo || !tecnica || !descricao) return mostrarErro(form, 'Preencha título, técnica e descrição.');

      const id = form.dataset.id;
      if (id) {
        const p = db.posts.find(x => x.id === id);
        if (!p || p.autorId !== db.sessao) return fecharModal();
        const anterior = JSON.stringify(p);
        if (p.tecnica !== tecnica && !p.imagem) p.arte = arteParaTecnica(tecnica);
        Object.assign(p, { titulo: titulo, tecnica: tecnica, descricao: descricao, editadoEm: Date.now() });
        if (ui.imagemPendente !== undefined) p.imagem = ui.imagemPendente;
        if (!p.arte) p.arte = arteParaTecnica(tecnica);
        if (!salvar()) { Object.assign(p, JSON.parse(anterior)); return; }
        aviso('Obra atualizada.');
      } else {
        const p = {
          id: novoId('p'),
          autorId: db.sessao,
          titulo: titulo,
          descricao: descricao,
          tecnica: tecnica,
          imagem: ui.imagemPendente || null,
          arte: arteParaTecnica(tecnica),
          criadoEm: Date.now(),
          curtidas: [],
          comentarios: []
        };
        db.posts.push(p);
        if (!salvar()) { db.posts.pop(); return; }
        ui.filtro = 'Todas';
        aviso('Obra publicada!');
      }
      fecharModal();
      renderizar();
    },

    comentar(form, d) {
      const texto = String(d.texto || '').trim();
      if (!texto) return;
      const p = db.posts.find(x => x.id === form.dataset.id);
      if (!p) return;
      p.comentarios.push({ id: novoId('c'), autorId: db.sessao, texto: texto, criadoEm: Date.now() });
      salvar();
      renderizar();
      const input = document.getElementById('com-' + p.id);
      if (input) input.focus();
    },

    perfil(form, d) {
      const nome = String(d.nome || '').trim();
      if (!nome) return mostrarErro(form, 'O nome não pode ficar em branco.');
      const eu = usuarioAtual();
      const anterior = JSON.stringify(eu);
      eu.nome = nome;
      eu.oficio = String(d.oficio || '').trim();
      eu.cidade = String(d.cidade || '').trim();
      eu.sobre = {
        historia: String(d.historia || '').trim(),
        inspiracoes: String(d.inspiracoes || '').trim(),
        tecnicas: String(d.tecnicas || '').trim()
      };
      eu.contato = {
        instagram: String(d.instagram || '').trim(),
        whatsapp: String(d.whatsapp || '').trim()
      };
      if (ui.avatarPendente !== undefined) eu.avatar = ui.avatarPendente;
      if (!salvar()) { Object.assign(eu, JSON.parse(anterior)); return; }
      ui.editandoPerfil = false;
      ui.avatarPendente = undefined;
      renderizar();
      aviso('Perfil atualizado.');
    }
  };

  document.addEventListener('submit', e => {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    const dados = {};
    new FormData(form).forEach((v, k) => { if (typeof v === 'string') dados[k] = v; });
    const fn = formularios[form.dataset.form];
    if (fn) fn(form, dados);
  });

  /* ---------- Início ---------- */

  document.getElementById('lista-tecnicas').innerHTML = TECNICAS.map(t => '<option value="' + esc(t) + '">').join('');
  window.addEventListener('hashchange', () => { fecharModal(); renderizar(); });
  renderizar();
})();
