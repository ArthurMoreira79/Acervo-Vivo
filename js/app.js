/* =========================================================
   Cultura em Rede — aplicação (SPA sem dependências)
   Vitrine e rede viva do artesanato e da cultura de São Luís, MA.

   Organização:
   1. Estado e persistência (localStorage)
   2. Utilitários
   3. Ilustrações geradas (para obras sem foto)
   4. Rotas e casca
   5. Telas (início/feed estilo Pinterest, perfil do artesão, login, cadastro)
   6. Componentes (card Pinterest, modal de detalhes da obra, modal de cadastro de obra)
   7. Eventos (cliques, busca em tempo real, formulários, uploads)
   ========================================================= */

(function () {
  'use strict';

  /* ---------- 1. Estado e persistência ---------- */

  // Módulo de armazenamento isolado com escopo privado (sem chaves literais expostas)
  const Armazenamento = (() => {
    const _storageKey = btoa('cultura_rede_slz_v2');

    return {
      obter(dadosIniciais) {
        try {
          const bruto = localStorage.getItem(_storageKey);
          if (bruto) {
            const dados = JSON.parse(bruto);
            if (dados && Array.isArray(dados.usuarios) && Array.isArray(dados.posts)) {
              return dados;
            }
          }
        } catch (e) { /* ambiente sem suporte a localStorage */ }
        const inicial = JSON.parse(JSON.stringify(dadosIniciais));
        try { localStorage.setItem(_storageKey, JSON.stringify(inicial)); } catch (e) {}
        return inicial;
      },
      gravar(dados) {
        try {
          localStorage.setItem(_storageKey, JSON.stringify(dados));
          return true;
        } catch (e) {
          return false;
        }
      },
      redefinir(dadosIniciais) {
        const inicial = JSON.parse(JSON.stringify(dadosIniciais));
        try { localStorage.setItem(_storageKey, JSON.stringify(inicial)); } catch (e) {}
        return inicial;
      }
    };
  })();

  function salvar() {
    if (!Armazenamento.gravar(db)) {
      aviso('Não foi possível salvar: o espaço do navegador acabou. Tente uma foto menor.', true);
      return false;
    }
    return true;
  }

  let db = Armazenamento.obter(window.DADOS_INICIAIS);

  const TECNICAS = [
    'Azulejaria', 'Fibra de Buriti', 'Bordado de Bumba Boi', 'Cerâmica',
    'Renda de Bilro', 'Xilogravura', 'Cestaria', 'Entalhe em Madeira',
    'Artesanato em Couro', 'Tecelagem', 'Pintura Popular'
  ];

  const CORES_AVATAR = ['#2F4A6B', '#B5532F', '#5B7553', '#9A6B1F', '#7A3E5C', '#3D6B6B'];

  const PALETAS = {
    ceramica: [['#F3E3CF', '#B5532F', '#2F4A6B'], ['#E9E4D6', '#5B7553', '#B5532F']],
    renda: [['#E9EEF3', '#2F4A6B', '#B5532F'], ['#F6EFE4', '#7A3E5C', '#2F4A6B']],
    bordado: [['#F6E7D7', '#7A3E5C', '#D9A441'], ['#EEF1E8', '#5B7553', '#B5532F']],
    cestaria: [['#F1E9D8', '#B5532F', '#D9A441'], ['#F1E9D8', '#5B7553', '#9A6B1F']],
    xilogravura: [['#F4ECDD', '#2B211B', '#B5532F']],
    tecelagem: [['#F3E3CF', '#2F4A6B', '#B5532F'], ['#F6EFE4', '#7A3E5C', '#D9A441']],
    madeira: [['#EADBC4', '#8F5A2B', '#5B3A1E']]
  };

  // Estado de interface (não é salvo)
  const ui = {
    filtro: 'Todas',
    busca: '',
    obraDetalheId: null,
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
      id: id,
      nome: 'Artesão de São Luís',
      oficio: 'Artesanato Local',
      cidade: 'São Luís, MA',
      cor: '#8A7A6D',
      avatar: null,
      sobre: {},
      contato: {}
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
    if (!el) return;
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

  function linkWhatsapp(numero, textoPersonalizado) {
    const digitos = String(numero || '').replace(/\D/g, '');
    if (!digitos) return '';
    const ddi = digitos.length <= 11 ? '55' + digitos : digitos;
    const msg = textoPersonalizado ? '?text=' + encodeURIComponent(textoPersonalizado) : '';
    return 'https://wa.me/' + ddi + msg;
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
    whatsapp: '<path d="M17.47 14.38c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.18.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.52-.08-.15-.68-1.64-.93-2.25-.24-.6-.49-.52-.68-.53l-.58-.01c-.2 0-.52.08-.8.38-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.07-.12-.27-.2-.57-.35z"/><path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.16-1.34A10 10 0 1 0 12 2z"/>',
    telefone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    livro: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
    brilho: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    mao: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 15.5L3 12a1.5 1.5 0 0 1 2.6-1.3L8 13"/>',
    lupa: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    setaDireita: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    sacola: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    estrela: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'
  };

  function icone(nome) {
    return '<svg class="icone icone-' + nome + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONES[nome] || '') + '</svg>';
  }

  const LOGO = '<svg class="logo-icone" viewBox="0 0 40 40" aria-hidden="true">' +
    '<circle cx="20" cy="20" r="19" fill="#2F4A6B"/>' +
    '<path d="M12 12h16l-2 5c3 3 3 8 0 11H14c-3-3-3-8 0-11z" fill="#FFF4EA"/>' +
    '<circle cx="20" cy="20" r="4.5" fill="#B5532F"/>' +
    '<path d="M10 20h20M20 10v20" stroke="#D9A441" stroke-width="1.6" stroke-dasharray="2 3"/>' +
    '</svg>';

  function avatar(u, tamanho) {
    const classe = 'avatar avatar-' + (tamanho || 'm');
    if (u.avatar) return '<img class="' + classe + '" src="' + esc(u.avatar) + '" alt="' + esc(u.nome) + '" loading="lazy">';
    return '<span class="' + classe + '" style="--cor:' + esc(u.cor || '#B5532F') + '" aria-hidden="true">' + esc(iniciais(u.nome)) + '</span>';
  }

  /* ---------- 3. Ilustrações geradas ---------- */

  function tipoDaTecnica(tecnica) {
    const t = semAcento(tecnica);
    if (/azulej|ceram|barro|argila|louca/.test(t)) return 'ceramica';
    if (/renda|bilro|croche|labirinto|file/.test(t)) return 'renda';
    if (/bord|boi|bumba|ponto|mican/.test(t)) return 'bordado';
    if (/buriti|cest|palha|tranc|vime|cipo|carnauba/.test(t)) return 'cestaria';
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
    const tipo = (a && a.tipo) || 'ceramica';
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
      default: { // cerâmica / azulejo
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
    return { tipo: tipo, cores: PALETAS[tipo] ? PALETAS[tipo][0] : PALETAS.ceramica[0] };
  }

  /* ---------- 4. Rotas e Casca ---------- */

  function irPara(hash) {
    if (location.hash === hash) renderizar();
    else location.hash = hash;
  }

  function trocarRota(hash) {
    history.replaceState(null, '', hash);
  }

  function renderizar() {
    const hashLimpa = location.hash.replace(/^#\/?/, '');
    const partes = hashLimpa.split('/');
    const pagina = partes[0] || 'inicio';
    const param = partes[1];
    const eu = usuarioAtual();
    let html;
    let rota = pagina;

    // Roteamento inteligente: visitantes entram direto na Home (#/inicio)
    if (pagina === 'login') {
      if (eu) { trocarRota('#/inicio'); rota = 'inicio'; html = casca(telaInicio(eu), 'inicio'); }
      else { rota = 'login'; html = telaLogin(); }
    } else if (pagina === 'cadastro') {
      if (eu) { trocarRota('#/inicio'); rota = 'inicio'; html = casca(telaInicio(eu), 'inicio'); }
      else { rota = 'cadastro'; html = telaCadastro(); }
    } else if (pagina === 'perfil') {
      if (!eu) {
        aviso('Faça login ou crie uma conta para acessar seu perfil de produtor.');
        trocarRota('#/login');
        rota = 'login';
        html = telaLogin();
      } else {
        rota = 'perfil';
        html = casca(telaPerfil(eu, eu), 'perfil');
      }
    } else if (pagina === 'artesao' && param) {
      const alvo = db.usuarios.find(u => u.id === param);
      if (alvo) {
        rota = 'artesao/' + alvo.id;
        html = casca(telaPerfil(alvo, eu), 'artesao');
      } else {
        aviso('Artesão não encontrado.', true);
        trocarRota('#/inicio');
        rota = 'inicio';
        html = casca(telaInicio(eu), 'inicio');
      }
    } else {
      // Página padrão: Home (pública, feed estilo Pinterest!)
      if (location.hash !== '#/inicio' && location.hash !== '#/' && location.hash !== '') {
        trocarRota('#/inicio');
      }
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
      const titulos = {
        login: 'Entrar',
        cadastro: 'Cadastrar Produtor',
        inicio: 'Obras & Artesãos de São Luís',
        perfil: 'Meu Perfil de Produtor'
      };
      let tituloDoc = titulos[rota];
      if (!tituloDoc && rota.startsWith('artesao')) {
        const artesao = db.usuarios.find(u => u.id === param);
        tituloDoc = artesao ? artesao.nome + ' · Artesão' : 'Artesão de São Luís';
      }
      document.title = (tituloDoc || 'Início') + ' · Cultura em Rede';
    }
    ui.ultimaRota = rota;

    // Se houver modal de detalhe aberto
    if (ui.obraDetalheId) {
      abrirModalDetalhes(ui.obraDetalheId);
    }
  }

  function casca(conteudo, ativo) {
    const eu = usuarioAtual();
    const atual = nome => ativo === nome ? ' aria-current="page"' : '';

    const acoesUsuario = eu
      ? '<div class="topo-acoes-usuario">' +
          '<button class="btn btn-sm btn-nova-obra" data-acao="nova-obra">' + icone('mais') + '<span>Publicar obra</span></button>' +
          '<a class="perfil-link" href="#/perfil" title="Meu perfil">' + avatar(eu, 'p') + '<span class="nome-produtor">' + esc(eu.nome.split(' ')[0]) + '</span></a>' +
          '<button class="btn-icone" data-acao="sair" title="Sair da conta" aria-label="Sair">' + icone('sair') + '</button>' +
        '</div>'
      : '<div class="topo-acoes-visitante">' +
          '<a class="btn-texto btn-login-nav" href="#/login">Entrar</a>' +
          '<a class="btn btn-destaque-topo" href="#/cadastro" title="Cadastre-se como artesão para divulgar seu trabalho">' +
            '<span>Comece a divulgar</span>' + icone('setaDireita') +
          '</a>' +
        '</div>';

    return '<header class="topo">' +
      '<div class="topo-interno">' +
        '<a class="marca" href="#/inicio">' +
          LOGO +
          '<div class="marca-texto">' +
            '<span class="marca-nome">Cultura em Rede</span>' +
            '<span class="marca-tag">São Luís · MA</span>' +
          '</div>' +
        '</a>' +

        '<div class="topo-busca">' +
          icone('lupa') +
          '<input id="input-busca-global" type="search" placeholder="Buscar obras, técnicas ou artesãos de São Luís…" value="' + esc(ui.busca) + '" autocomplete="off" aria-label="Buscar obras e artesãos">' +
          (ui.busca ? '<button class="limpar-busca" data-acao="limpar-busca" title="Limpar busca">' + icone('fechar') + '</button>' : '') +
        '</div>' +

        '<nav class="nav" aria-label="Navegação">' +
          '<a href="#/inicio"' + atual('inicio') + '>' + icone('casa') + '<span class="rotulo">Início</span></a>' +
          (eu ? '<a href="#/perfil"' + atual('perfil') + '>' + icone('pessoa') + '<span class="rotulo">Meu Perfil</span></a>' : '') +
        '</nav>' +

        acoesUsuario +
      '</div>' +
      '</header>' +
      '<main class="conteudo-principal" id="conteudo">' + conteudo + '</main>' +
      navMobile(eu, atual);
  }

  // Barra de navegação inferior exibida apenas em telas pequenas (mobile)
  function navMobile(eu, atual) {
    const itens = [
      '<a href="#/inicio"' + atual('inicio') + '>' + icone('casa') + '<span>Início</span></a>',
      '<button type="button" data-acao="focar-busca">' + icone('lupa') + '<span>Buscar</span></button>'
    ];
    if (eu) {
      itens.push('<button type="button" class="nav-mobile-publicar" data-acao="nova-obra" aria-label="Publicar nova obra">' + icone('mais') + '<span>Publicar</span></button>');
      itens.push('<a href="#/perfil"' + atual('perfil') + '>' + icone('pessoa') + '<span>Perfil</span></a>');
    } else {
      itens.push('<a href="#/cadastro" class="nav-mobile-publicar">' + icone('mais') + '<span>Divulgar</span></a>');
      itens.push('<a href="#/login">' + icone('pessoa') + '<span>Entrar</span></a>');
    }
    return '<nav class="nav-mobile" aria-label="Navegação móvel">' + itens.join('') + '</nav>';
  }

  /* ---------- 5. Telas ---------- */

  function painelArte(titulo, texto) {
    return '<section class="entrada-arte">' +
      '<div class="fundo">' + arte({ tipo: 'ceramica', cores: ['#1A324E', '#B5532F', '#D9A441'] }) + '</div>' +
      '<a class="marca" href="#/inicio">' + LOGO + '<div><span class="marca-nome" style="color:#FFF4EA">Cultura em Rede</span><div class="marca-tag" style="color:#E5D7C3">São Luís · Maranhão</div></div></a>' +
      '<div class="arte-conteudo">' +
        '<span class="selo-cultura">' + icone('estrela') + ' Vitrine Oficial de Artesãos</span>' +
        '<h1>' + titulo + '</h1>' +
        '<p>' + texto + '</p>' +
      '</div>' +
      '<p class="rodape-arte">Conectando os saberes tradicionais da Ilha do Amor a apreciadores de todo o Brasil.</p>' +
      '</section>';
  }

  function telaLogin() {
    return '<div class="entrada">' +
      painelArte('Suas criações merecem encantar o mundo.', 'Acesse sua conta para publicar novas obras, gerenciar seu catálogo e receber pedidos de admiradores.') +
      '<section class="entrada-form"><div class="caixa">' +
      '<a class="voltar-inicio" href="#/inicio">← Voltar para a galeria de obras</a>' +
      '<h2>Área do Produtor</h2><p class="sub">Bem-vindo(a) de volta! Entre para divulgar suas obras.</p>' +
      '<form data-form="login" novalidate>' +
      '<div class="campo"><label for="login-email">E-mail</label><input id="login-email" name="email" type="email" autocomplete="email" placeholder="seuemail@exemplo.com" required></div>' +
      '<div class="campo"><label for="login-senha">Senha</label><input id="login-senha" name="senha" type="password" autocomplete="current-password" placeholder="Sua senha de acesso" required></div>' +
      '<p class="erro-form" role="alert"></p>' +
      '<button class="btn btn-bloco btn-lg" type="submit">Entrar como produtor</button>' +
      '</form>' +
      '<p class="alternar">É artesão em São Luís e ainda não tem conta? <a href="#/cadastro">Cadastre-se gratuitamente</a></p>' +
      '<div class="demo"><strong>Contas de demonstração de artesãos locais:</strong>' +
      '<div class="demo-contas">' +
      '<div>• Maria da Graça (Azulejos): <code>maria@culturaemrede.com</code></div>' +
      '<div>• Mestre Raimundo (Buriti): <code>raimundo@culturaemrede.com</code></div>' +
      '<div>• Dona Tereza (Boi): <code>tereza@culturaemrede.com</code></div>' +
      '</div>' +
      '<div style="font-size:0.85rem;margin-top:0.4rem;color:var(--tinta-3)">Senha padrão: <code>123456</code></div>' +
      '<button type="button" class="btn-texto" data-acao="preencher-demo" style="margin-top:.4rem;padding-left:0;color:var(--barro-esc)">Preencher como Maria da Graça</button></div>' +
      '</div></section></div>';
  }

  function telaCadastro() {
    return '<div class="entrada">' +
      painelArte('Espalhe a arte e a cultura de São Luís.', 'Crie seu perfil profissional, adicione seus contatos de WhatsApp e Instagram e divulgue suas peças sem intermediários.') +
      '<section class="entrada-form"><div class="caixa">' +
      '<a class="voltar-inicio" href="#/inicio">← Voltar para a galeria de obras</a>' +
      '<h2>Cadastro de Produtor</h2><p class="sub">Divulgue suas obras para quem ama o artesanato de São Luís.</p>' +
      '<form data-form="cadastro" novalidate>' +
      '<div class="campo"><label for="cad-nome">Seu nome ou Ateliê</label><input id="cad-nome" name="nome" autocomplete="name" placeholder="Ex.: Mestre Tiago do Maranhão" required maxlength="80"></div>' +
      '<div class="linha-campos">' +
      '<div class="campo"><label for="cad-oficio">Seu ofício principal</label><input id="cad-oficio" name="oficio" list="lista-tecnicas" placeholder="Ex.: Azulejaria, Fibra de Buriti..." required maxlength="60"></div>' +
      '<div class="campo"><label for="cad-cidade">Bairro / Cidade</label><input id="cad-cidade" name="cidade" placeholder="Ex.: Centro Histórico, São Luís - MA" value="São Luís, MA" maxlength="60"></div>' +
      '</div>' +
      '<div class="linha-campos">' +
      '<div class="campo"><label for="cad-insta">Instagram (opcional)</label><input id="cad-insta" name="instagram" placeholder="@seu.atelie" maxlength="40"></div>' +
      '<div class="campo"><label for="cad-zap">WhatsApp de vendas</label><input id="cad-zap" name="whatsapp" type="tel" placeholder="(98) 99999-9999" maxlength="20"></div>' +
      '</div>' +
      '<div class="campo"><label for="cad-email">E-mail</label><input id="cad-email" name="email" type="email" autocomplete="email" placeholder="seu@email.com" required></div>' +
      '<div class="campo"><label for="cad-senha">Senha</label><input id="cad-senha" name="senha" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" required minlength="6"></div>' +
      '<p class="erro-form" role="alert"></p>' +
      '<button class="btn btn-bloco btn-lg" type="submit">Criar meu perfil e começar a divulgar</button>' +
      '</form>' +
      '<p class="alternar">Já tem conta cadastrada? <a href="#/login">Entrar</a></p>' +
      '</div></section></div>';
  }

  function postsOrdenados(filtroFn) {
    return db.posts.filter(filtroFn || (() => true)).sort((a, b) => b.criadoEm - a.criadoEm);
  }

  function curtidasRecebidas(u) {
    return db.posts.filter(p => p.autorId === u.id).reduce((t, p) => t + p.curtidas.length, 0);
  }

  /* ---------- Tela Início (Mural Pinterest) ---------- */

  function telaInicio(eu) {
    // Lista de técnicas para filtros estilo pílulas/chips Pinterest
    const tecnicasUsadas = [...new Set(db.posts.map(p => p.tecnica).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (ui.filtro !== 'Todas' && !tecnicasUsadas.includes(ui.filtro)) ui.filtro = 'Todas';

    const chips = ['Todas'].concat(tecnicasUsadas).map(t =>
      '<button class="chip ' + (ui.filtro === t ? 'ativo' : '') + '" data-acao="filtrar" data-valor="' + esc(t) + '" aria-pressed="' + (ui.filtro === t) + '">' + esc(t) + '</button>'
    ).join('');

    // Filtro por técnica e busca textual
    const buscaNorm = semAcento(ui.busca);
    const lista = postsOrdenados(p => {
      const passaTecnica = ui.filtro === 'Todas' || p.tecnica === ui.filtro;
      if (!passaTecnica) return false;
      if (!buscaNorm) return true;
      const autor = usuarioPorId(p.autorId);
      const texto = semAcento(p.titulo + ' ' + p.descricao + ' ' + (p.tecnica || '') + ' ' + autor.nome + ' ' + (autor.oficio || '') + ' ' + (autor.cidade || ''));
      return texto.includes(buscaNorm);
    });

    // Mural estilo Pinterest (Masonry grid)
    const feed = lista.length
      ? '<div class="mural-pinterest" id="mural-obras">' +
          lista.map(p => cardPin(p, eu)).join('') +
        '</div>'
      : '<div class="cartao vazio-pinterest">' +
          '<div class="vazio-icone">' + icone('sacola') + '</div>' +
          '<h3>Nenhuma obra encontrada</h3>' +
          '<p>' + (ui.busca ? 'Não encontramos resultados para "' + esc(ui.busca) + '". Tente outras palavras ou limpe a busca.' : 'Seja o primeiro a compartilhar uma obra nesta categoria!') + '</p>' +
          (ui.busca ? '<button class="btn btn-sec" data-acao="limpar-busca">Limpar busca</button>' : (eu ? '<button class="btn" data-acao="nova-obra">' + icone('mais') + 'Publicar obra</button>' : '<a class="btn" href="#/cadastro">Cadastre-se para divulgar</a>')) +
        '</div>';

    // Hero Banner no topo da página (Destaque acolhedor com chamada para novos produtores)
    const bannerHero =
      '<section class="hero-pinterest" aria-label="Apresentação do Cultura em Rede">' +
        '<div class="hero-conteudo">' +
          '<div class="hero-badge">' + icone('brilho') + ' Feito à mão em São Luís do Maranhão</div>' +
          '<h1 class="hero-titulo">A arte e a alma de São Luís reunidas em um só lugar.</h1>' +
          '<p class="hero-descricao">' +
            'Explore criações autênticas de artesãos maranhenses: azulejos coloniais, fibra de buriti, bordados do Bumba Meu Boi, cerâmicas e gravuras. Inspire-se e <strong>compre diretamente com quem faz</strong>.' +
          '</p>' +
          '<div class="hero-cta-grupo">' +
            '<a class="btn btn-cta-principal" href="#/cadastro">' +
              icone('mais') +
              '<span>Quer criar e divulgar suas obras? Comece por aqui</span>' +
            '</a>' +
            '<a class="btn btn-sec btn-cta-secundario" href="#mural-secao">' +
              'Explorar criações' +
            '</a>' +
          '</div>' +
        '</div>' +
        '<div class="hero-destaques-artesaos">' +
          '<div class="artesaos-chamada">Artesãos em destaque na Ilha:</div>' +
          '<div class="artesaos-avatares-lista">' +
            db.usuarios.slice(0, 5).map(u =>
              '<a class="artesao-pill" href="#/artesao/' + esc(u.id) + '" title="' + esc(u.nome) + ' (' + esc(u.oficio) + ')">' +
                avatar(u, 'p') +
                '<span class="artesao-pill-nome">' + esc(u.nome.split(' ')[0]) + '</span>' +
              '</a>'
            ).join('') +
          '</div>' +
        '</div>' +
      '</section>';

    // Banner no rodapé convidando os artesãos / produtores
    const bannerRodapeCTA =
      '<section class="banner-rodape-cta" aria-label="Chamada para produtores">' +
        '<div class="banner-rodape-conteudo">' +
          '<div class="banner-icone">' + icone('mao') + '</div>' +
          '<div class="banner-textos">' +
            '<h2>Você é artesão ou produtor cultural em São Luís?</h2>' +
            '<p>O Cultura em Rede é a sua vitrine gratuita. Divulgue suas peças com fotos, receba encomendas pelo WhatsApp e fortaleça a nossa tradição popular.</p>' +
          '</div>' +
          '<div class="banner-botao">' +
            '<a class="btn btn-cta-rodape" href="#/cadastro">' +
              '<span>Quer criar e divulgar suas obras? Comece por aqui</span>' +
              icone('setaDireita') +
            '</a>' +
          '</div>' +
        '</div>' +
      '</section>';

    return '<div class="pagina-inicio">' +
      bannerHero +
      '<section class="secao-feed" id="mural-secao">' +
        '<div class="barra-filtros-topo">' +
          '<div class="filtros-chips" role="group" aria-label="Filtrar por técnica">' + chips + '</div>' +
          '<div class="contador-obras">Mostrando <strong>' + lista.length + '</strong> ' + (lista.length === 1 ? 'obra' : 'obras') + '</div>' +
        '</div>' +
        feed +
      '</section>' +
      bannerRodapeCTA +
      '</div>';
  }

  /* ---------- 6. Componentes Estilo Pinterest ---------- */

  function cardPin(p, eu) {
    const autor = usuarioPorId(p.autorId);
    const ehMeu = eu && p.autorId === eu.id;
    const curtiu = eu && p.curtidas.includes(eu.id);
    const nCurtidas = p.curtidas.length;
    const nComent = p.comentarios.length;

    // Mensagem pronta para o WhatsApp de compra/encomenda
    const msgWhatsapp = 'Olá, ' + autor.nome + '! Vi sua obra "' + p.titulo + '" no Cultura em Rede e gostaria de saber mais informações!';
    const linkZap = autor.contato && autor.contato.whatsapp ? linkWhatsapp(autor.contato.whatsapp, msgWhatsapp) : '';
    const linkInsta = autor.contato && autor.contato.instagram ? linkInstagram(autor.contato.instagram) : '';

    const midia = p.imagem
      ? '<div class="pin-midia" data-acao="ver-detalhe" data-id="' + esc(p.id) + '">' +
          '<img src="' + esc(p.imagem) + '" alt="' + esc(p.titulo) + '" loading="lazy">' +
          '<div class="pin-hover-overlay">' +
            '<span class="btn-ver-obra">Ver detalhes & Contato</span>' +
          '</div>' +
        '</div>'
      : '<div class="pin-midia pin-midia-arte" data-acao="ver-detalhe" data-id="' + esc(p.id) + '">' +
          arte(p.arte || arteParaTecnica(p.tecnica), p.titulo) +
          '<div class="pin-hover-overlay">' +
            '<span class="btn-ver-obra">Ver detalhes & Contato</span>' +
          '</div>' +
        '</div>';

    const acoesAutor = ehMeu
      ? '<div class="pin-acoes-autor">' +
          '<button class="btn-icone-p" data-acao="editar-obra" data-id="' + esc(p.id) + '" title="Editar obra" aria-label="Editar">' + icone('lapis') + '</button>' +
          '<button class="btn-icone-p" data-acao="excluir-obra" data-id="' + esc(p.id) + '" title="Excluir obra" aria-label="Excluir">' + icone('lixo') + '</button>' +
        '</div>'
      : '';

    return '<article class="card-pin" id="pin-' + esc(p.id) + '">' +
      '<div class="pin-topo-card">' +
        (p.tecnica ? '<span class="pin-badge-tecnica">' + esc(p.tecnica) + '</span>' : '') +
        acoesAutor +
      '</div>' +

      midia +

      '<div class="pin-detalhes">' +
        '<h3 class="pin-titulo" data-acao="ver-detalhe" data-id="' + esc(p.id) + '">' + esc(p.titulo) + '</h3>' +
        '<p class="pin-descricao">' + esc(p.descricao) + '</p>' +
      '</div>' +

      '<footer class="pin-autor-rodape">' +
        '<div class="pin-perfil-box">' +
          '<a class="pin-autor-link" href="#/artesao/' + esc(autor.id) + '" title="Ver perfil e todas as obras de ' + esc(autor.nome) + '">' +
            avatar(autor, 'p') +
            '<div class="pin-autor-meta">' +
              '<span class="pin-autor-nome">' + esc(autor.nome) + '</span>' +
              '<span class="pin-autor-cidade">' + icone('local') + esc(autor.cidade ? autor.cidade.split('·')[0].trim() : 'São Luís, MA') + '</span>' +
            '</div>' +
          '</a>' +
        '</div>' +

        '<div class="pin-redes-box">' +
          (linkZap ? '<a class="rede-btn rede-zap" href="' + esc(linkZap) + '" target="_blank" rel="noopener" title="Falar no WhatsApp com ' + esc(autor.nome) + '">' + icone('whatsapp') + '</a>' : '') +
          (linkInsta ? '<a class="rede-btn rede-insta" href="' + esc(linkInsta) + '" target="_blank" rel="noopener" title="Instagram de ' + esc(autor.nome) + '">' + icone('instagram') + '</a>' : '') +
          '<button class="btn-reacao-pin ' + (curtiu ? 'curtido' : '') + '" data-acao="curtir" data-id="' + esc(p.id) + '" title="' + (curtiu ? 'Descurtir' : 'Curtir obra') + '">' +
            icone('coracao') +
            '<span class="contagem-curtidas">' + nCurtidas + '</span>' +
          '</button>' +
        '</div>' +
      '</footer>' +
      '</article>';
  }

  /* ---------- Modal de Detalhes da Obra (Estilo Pinterest) ---------- */

  function abrirModalDetalhes(id) {
    const p = db.posts.find(x => x.id === id);
    if (!p) return;
    ui.obraDetalheId = id;
    const autor = usuarioPorId(p.autorId);
    const eu = usuarioAtual();
    const curtiu = eu && p.curtidas.includes(eu.id);
    const ehMeu = eu && p.autorId === eu.id;

    const msgWhatsapp = 'Olá, ' + autor.nome + '! Adorei sua obra "' + p.titulo + '" no Cultura em Rede. Poderia me passar mais informações sobre valor e encomenda?';
    const linkZap = autor.contato && autor.contato.whatsapp ? linkWhatsapp(autor.contato.whatsapp, msgWhatsapp) : '';
    const linkInsta = autor.contato && autor.contato.instagram ? linkInstagram(autor.contato.instagram) : '';

    const midiaGrande = p.imagem
      ? '<img class="detalhe-img" src="' + esc(p.imagem) + '" alt="' + esc(p.titulo) + '">'
      : '<div class="detalhe-arte-svg">' + arte(p.arte || arteParaTecnica(p.tecnica), p.titulo) + '</div>';

    const listaComentarios = p.comentarios.length
      ? p.comentarios.map(c => {
          const a = usuarioPorId(c.autorId);
          return '<div class="detalhe-comentario">' +
            avatar(a, 'p') +
            '<div class="detalhe-comentario-balao">' +
              '<div class="detalhe-comentario-topo">' +
                '<a href="#/artesao/' + esc(a.id) + '" data-acao="fechar-modal">' + esc(a.nome) + '</a>' +
                '<span class="quando">' + esc(tempoRelativo(c.criadoEm)) + '</span>' +
              '</div>' +
              '<p>' + esc(c.texto) + '</p>' +
            '</div>' +
          '</div>';
        }).join('')
      : '<p class="sem-comentarios">Nenhum comentário ainda. Deixe sua mensagem para o artesão!</p>';

    const formComentario = eu
      ? '<form class="form-comentario-detalhe" data-form="comentar" data-id="' + esc(p.id) + '">' +
          avatar(eu, 'p') +
          '<input name="texto" placeholder="Escreva uma mensagem ou elogio sobre a obra…" maxlength="500" required autocomplete="off">' +
          '<button class="btn btn-sm" type="submit">Enviar</button>' +
        '</form>'
      : '<div class="aviso-login-comentario">' +
          '<p>Quer elogiar a obra ou conversar com o artesão?</p>' +
          '<a class="btn btn-sec btn-sm" href="#/login" data-acao="fechar-modal">Entre na sua conta</a>' +
        '</div>';

    modalRaiz.innerHTML =
      '<div class="modal-fundo" data-acao="fechar-modal-fundo">' +
      '<div class="modal modal-detalhe-pin" role="dialog" aria-modal="true" aria-labelledby="detalhe-titulo">' +
        '<button class="btn-fechar-modal" data-acao="fechar-modal" aria-label="Fechar">' + icone('fechar') + '</button>' +
        '<div class="detalhe-grid">' +
          '<div class="detalhe-lado-midia">' +
            midiaGrande +
          '</div>' +
          '<div class="detalhe-lado-info">' +
            '<div class="detalhe-header">' +
              (p.tecnica ? '<span class="pin-badge-tecnica">' + esc(p.tecnica) + '</span>' : '') +
              '<div class="detalhe-acoes-topo">' +
                '<button class="btn-reacao-pin ' + (curtiu ? 'curtido' : '') + '" data-acao="curtir" data-id="' + esc(p.id) + '">' +
                  icone('coracao') + ' <span>' + p.curtidas.length + ' curtidas</span>' +
                '</button>' +
              '</div>' +
            '</div>' +

            '<h2 id="detalhe-titulo" class="detalhe-titulo">' + esc(p.titulo) + '</h2>' +
            '<p class="detalhe-texto">' + esc(p.descricao) + '</p>' +
            '<div class="detalhe-data-publicacao">' + icone('calendario') + ' Publicado ' + esc(tempoRelativo(p.criadoEm)) + '</div>' +

            '<div class="detalhe-card-artesao">' +
              '<a class="artesao-link-completo" href="#/artesao/' + esc(autor.id) + '" data-acao="fechar-modal">' +
                avatar(autor, 'm') +
                '<div class="artesao-dados">' +
                  '<strong>' + esc(autor.nome) + '</strong>' +
                  '<span>' + esc(autor.oficio || 'Artesão de São Luís') + '</span>' +
                  '<span class="cidade">' + icone('local') + esc(autor.cidade || 'São Luís, MA') + '</span>' +
                '</div>' +
              '</a>' +
              '<div class="artesao-botoes-contato">' +
                (linkZap ? '<a class="btn btn-zap-destaque" href="' + esc(linkZap) + '" target="_blank" rel="noopener">' + icone('whatsapp') + ' Falar no WhatsApp / Comprar</a>' : '') +
                (linkInsta ? '<a class="btn btn-sec btn-sm" href="' + esc(linkInsta) + '" target="_blank" rel="noopener">' + icone('instagram') + ' Ver Instagram</a>' : '') +
              '</div>' +
            '</div>' +

            '<div class="detalhe-secao-comentarios">' +
              '<h3>Comentários (' + p.comentarios.length + ')</h3>' +
              '<div class="lista-comentarios-scroll">' + listaComentarios + '</div>' +
              formComentario +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '</div>';

    document.body.style.overflow = 'hidden';
  }

  /* ---------- Tela Perfil do Artesão ---------- */

  function telaPerfil(u, eu) {
    const ehMeu = eu && u.id === eu.id;
    const sobre = u.sobre || {};
    const contato = u.contato || {};
    const obras = postsOrdenados(p => p.autorId === u.id);

    const msgWhatsapp = 'Olá, ' + u.nome + '! Encontrei seu perfil no Cultura em Rede e gostaria de conhecer e encomendar seus trabalhos artesanais!';
    const linkZap = contato.whatsapp ? linkWhatsapp(contato.whatsapp, msgWhatsapp) : '';
    const linkInsta = contato.instagram ? linkInstagram(contato.instagram) : '';

    const botoes = ehMeu
      ? '<button class="btn btn-sec" data-acao="editar-perfil">' + icone('lapis') + 'Editar meu perfil</button>' +
        '<button class="btn" data-acao="nova-obra">' + icone('mais') + 'Publicar nova obra</button>'
      : (linkZap ? '<a class="btn btn-zap-destaque" href="' + esc(linkZap) + '" target="_blank" rel="noopener">' + icone('whatsapp') + ' Conversar no WhatsApp</a>' : '') +
        (linkInsta ? '<a class="btn btn-sec" href="' + esc(linkInsta) + '" target="_blank" rel="noopener">' + icone('instagram') + ' Instagram</a>' : '');

    const topo = '<div class="cartao perfil-topo">' +
      '<div class="perfil-capa">' + arte(arteDoUsuario(u)) + '</div>' +
      '<div class="perfil-id">' +
        avatar(u, 'g') +
        '<div class="info">' +
          '<h1>' + esc(u.nome) + '</h1>' +
          '<p class="oficio">' + esc(u.oficio || 'Artesão de São Luís') + '</p>' +
          '<div class="local">' + icone('local') + esc(u.cidade || 'São Luís, MA') + '</div>' +
          '<div class="perfil-numeros">' +
            '<span><strong>' + obras.length + '</strong> ' + (obras.length === 1 ? 'obra publicada' : 'obras publicadas') + '</span>' +
            '<span><strong>' + curtidasRecebidas(u) + '</strong> curtidas recebidas</span>' +
          '</div>' +
        '</div>' +
        '<div class="botoes">' + botoes + '</div>' +
      '</div>' +
      '</div>';

    const secaoSobre = (ehMeu && ui.editandoPerfil)
      ? formularioPerfil(u)
      : '<section class="cartao cartao-corpo sobre" aria-labelledby="titulo-sobre">' +
          '<div class="sobre-header-linha">' +
            '<h2 id="titulo-sobre">Sobre o Artesão</h2>' +
            (ehMeu ? '<button class="btn-texto" data-acao="editar-perfil">' + icone('lapis') + 'Editar informações</button>' : '') +
          '</div>' +
          blocoSobre('livro', 'Trajetória e História', sobre.historia, ehMeu, 'Conte como começou no artesanato de São Luís, suas raízes e o que a arte representa para você.') +
          blocoSobre('brilho', 'Inspirações e Cultura Maranhense', sobre.inspiracoes, ehMeu, 'Quais tradições, lugares de São Luís ou mestres inspiram o seu trabalho?') +
          blocoSobre('mao', 'Técnicas e Matérias-Primas', sobre.tecnicas, ehMeu, 'Quais materiais você utiliza? Como é o processo manual de criação?') +
        '</section>';

    const listaObras = obras.length
      ? '<div class="mural-pinterest">' + obras.map(p => cardPin(p, eu)).join('') + '</div>'
      : '<div class="cartao vazio-pinterest">' +
          '<h3>' + (ehMeu ? 'Você ainda não compartilhou obras' : 'Nenhuma obra cadastrada ainda') + '</h3>' +
          (ehMeu ? '<p>Mostre seu talento! Publique fotos das suas peças para serem descobertas no Cultura em Rede.</p><button class="btn" data-acao="nova-obra">' + icone('mais') + 'Publicar primeira obra</button>' : '') +
        '</div>';

    const itensContato = [];
    if (u.cidade) itensContato.push('<li>' + icone('local') + '<span>' + esc(u.cidade) + '</span></li>');
    if (linkInsta) itensContato.push('<li>' + icone('instagram') + '<a href="' + esc(linkInsta) + '" target="_blank" rel="noopener">' + esc(contato.instagram) + '</a></li>');
    if (linkZap) itensContato.push('<li>' + icone('whatsapp') + '<a href="' + esc(linkZap) + '" target="_blank" rel="noopener">' + esc(contato.whatsapp) + '</a></li>');
    itensContato.push('<li>' + icone('calendario') + '<span>No Cultura em Rede desde ' + esc(dataLonga(u.criadoEm || Date.now())) + '</span></li>');

    const lateral = '<aside class="lateral-perfil">' +
      '<div class="cartao cartao-corpo">' +
        '<h2 class="cartao-titulo">Contato & Encomendas</h2>' +
        '<ul class="contatos">' + itensContato.join('') + '</ul>' +
        (ehMeu && !contato.whatsapp ? '<p class="dica-contato">Adicione seu WhatsApp de vendas para receber pedidos diretos.</p>' : '') +
      '</div>' +
      '<a class="btn btn-sec btn-bloco" href="#/inicio">← Voltar para a Galeria Geral</a>' +
      '</aside>';

    return '<div class="perfil-container">' +
      topo +
      '<div class="grade-perfil">' +
        '<div class="principal">' +
          secaoSobre +
          '<div class="titulo-secao-obras">' +
            '<h2>Obras de ' + esc(u.nome) + '</h2>' +
            '<span>' + obras.length + ' criações</span>' +
          '</div>' +
          listaObras +
        '</div>' +
        lateral +
      '</div>' +
      '</div>';
  }

  function blocoSobre(icon, titulo, texto, ehMeu, dicaVazio) {
    const conteudo = texto
      ? '<p>' + esc(texto) + '</p>'
      : '<p class="pendente">' + (ehMeu ? dicaVazio : 'Ainda não foi preenchido pelo artesão.') + '</p>';
    return '<div class="sobre-bloco"><h3>' + icone(icon) + '<span>' + titulo + '</span></h3>' + conteudo + '</div>';
  }

  function formularioPerfil(u) {
    const s = u.sobre || {};
    const c = u.contato || {};
    const avatarPrevia = ui.avatarPendente === undefined ? u : Object.assign({}, u, { avatar: ui.avatarPendente });

    return '<section class="cartao cartao-corpo editar-perfil" aria-labelledby="titulo-editar">' +
      '<h2 id="titulo-editar">Editar Perfil de Produtor</h2>' +
      '<form data-form="perfil" novalidate>' +
      '<div class="editor-avatar"><div id="previa-avatar">' + avatar(avatarPrevia, 'm') + '</div>' +
        '<div class="botoes">' +
        '<label class="btn btn-sec btn-arquivo">' + icone('imagem') + 'Trocar foto<input type="file" accept="image/*" data-imagem="avatar" aria-label="Escolher foto de perfil"></label>' +
        (avatarPrevia.avatar ? '<button type="button" class="btn-texto" data-acao="remover-avatar">Remover foto</button>' : '') +
        '</div></div>' +

      '<fieldset><legend>Identificação</legend>' +
        '<div class="campo"><label for="pf-nome">Nome Completo ou Nome Artístico</label><input id="pf-nome" name="nome" value="' + esc(u.nome) + '" required maxlength="80"></div>' +
        '<div class="linha-campos">' +
        '<div class="campo"><label for="pf-oficio">Ofício Principal</label><input id="pf-oficio" name="oficio" list="lista-tecnicas" value="' + esc(u.oficio) + '" placeholder="Ex.: Azulejaria Tradicional" maxlength="60"></div>' +
        '<div class="campo"><label for="pf-cidade">Bairro / Localidade em São Luís</label><input id="pf-cidade" name="cidade" value="' + esc(u.cidade) + '" placeholder="Ex.: Praia Grande, São Luís - MA" maxlength="60"></div>' +
        '</div></fieldset>' +

      '<fieldset><legend>Sobre Sua Arte</legend>' +
        '<div class="campo"><label for="pf-historia">Sua História e Trajetória</label><textarea id="pf-historia" name="historia" rows="5" maxlength="3000" placeholder="Como começou? Quem te ensinou? Há quantos anos trabalha com o artesanato maranhense?">' + esc(s.historia) + '</textarea></div>' +
        '<div class="campo"><label for="pf-inspiracoes">Inspirações</label><textarea id="pf-inspiracoes" name="inspiracoes" rows="3" maxlength="1500" placeholder="O que te inspira em São Luís? Festas tradicionais, lendas, natureza...">' + esc(s.inspiracoes) + '</textarea></div>' +
        '<div class="campo"><label for="pf-tecnicas">Técnicas e Matérias-Primas</label><textarea id="pf-tecnicas" name="tecnicas" rows="3" maxlength="1500" placeholder="Materiais que utiliza (palha de buriti, barro, tecidos, miçangas), processos de queima ou cura...">' + esc(s.tecnicas) + '</textarea></div>' +
      '</fieldset>' +

      '<fieldset><legend>Canais de Venda e Redes Sociais</legend>' +
        '<div class="linha-campos">' +
        '<div class="campo"><label for="pf-insta">Instagram Comercial</label><input id="pf-insta" name="instagram" value="' + esc(c.instagram) + '" placeholder="@seu.atelie" maxlength="40"></div>' +
        '<div class="campo"><label for="pf-zap">WhatsApp para Pedidos</label><input id="pf-zap" name="whatsapp" type="tel" value="' + esc(c.whatsapp) + '" placeholder="(98) 99999-9999" maxlength="20"></div>' +
        '</div></fieldset>' +

      '<p class="erro-form" role="alert"></p>' +
      '<div class="acoes"><button type="button" class="btn btn-sec" data-acao="cancelar-perfil">Cancelar</button>' +
      '<button type="submit" class="btn">Salvar alterações</button></div>' +
      '</form></section>';
  }

  /* ---------- Modal de Publicação / Edição de Obra ---------- */

  function previaObra(imagem) {
    return imagem
      ? '<img src="' + esc(imagem) + '" alt="Prévia da foto">'
      : '<div class="sem-foto">' + icone('imagem') + '<br>Sem foto? A obra receberá uma ilustração artística inspirada na técnica escolhida.</div>';
  }

  function abrirModalObra(id) {
    const eu = usuarioAtual();
    if (!eu) {
      aviso('Você precisa estar logado como produtor para publicar obras.');
      irPara('#/login');
      return;
    }

    const p = id ? db.posts.find(x => x.id === id) : null;
    if (id && !p) return;
    ui.imagemPendente = undefined;
    const imagem = p ? p.imagem : null;

    modalRaiz.innerHTML =
      '<div class="modal-fundo" data-acao="fechar-modal-fundo">' +
      '<div class="modal modal-obra" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">' +
      '<div class="modal-cabecalho"><h2 id="modal-titulo">' + (p ? 'Editar obra' : 'Publicar nova obra no Cultura em Rede') + '</h2>' +
      '<button class="btn-icone" data-acao="fechar-modal" aria-label="Fechar">' + icone('fechar') + '</button></div>' +
      '<form data-form="obra" data-id="' + esc(p ? p.id : '') + '" novalidate>' +
      '<div class="modal-corpo">' +
        '<div class="campo"><label for="ob-titulo">Título da Obra / Peça</label><input id="ob-titulo" name="titulo" required maxlength="100" value="' + esc(p ? p.titulo : '') + '" placeholder="Ex.: Painel de Azulejo Colonial São Marcos"></div>' +
        '<div class="campo"><label for="ob-tecnica">Técnica Artesanal</label><input id="ob-tecnica" name="tecnica" list="lista-tecnicas" required maxlength="40" value="' + esc(p ? p.tecnica : '') + '" placeholder="Ex.: Azulejaria, Fibra de Buriti, Bordado..."></div>' +
        '<div class="campo"><label for="ob-descricao">Descrição e Detalhes da Peça</label><textarea id="ob-descricao" name="descricao" rows="5" required maxlength="3000" placeholder="Conte sobre a peça: materiais utilizados, tempo de feitura, dimensões, significados e inspirações maranhenses…">' + esc(p ? p.descricao : '') + '</textarea></div>' +
        '<div class="campo"><span id="rotulo-foto" style="font-weight:600;font-size:.95rem">Foto da obra <span style="font-weight:400;color:var(--tinta-3)">(Recomendado para o feed estilo Pinterest)</span></span>' +
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
      '<button type="submit" class="btn">' + (p ? 'Salvar alterações' : 'Publicar na Galeria') + '</button></div>' +
      '</form></div></div>';

    document.body.style.overflow = 'hidden';
    setTimeout(() => { const el = document.getElementById('ob-titulo'); if (el) el.focus(); }, 40);
  }

  function fecharModal() {
    if (!modalRaiz.innerHTML) return;
    modalRaiz.innerHTML = '';
    document.body.style.overflow = '';
    ui.imagemPendente = undefined;
    ui.obraDetalheId = null;
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
      aviso('Sessão encerrada.');
      irPara('#/inicio');
    },
    'preencher-demo'() {
      const email = document.getElementById('login-email');
      const senha = document.getElementById('login-senha');
      if (email && senha) {
        email.value = 'maria@culturaemrede.com';
        senha.value = '123456';
      }
    },
    'restaurar'() {
      if (!confirm('Deseja restaurar as obras e perfis de demonstração de São Luís? Dados criados localmente serão redefinidos.')) return;
      db = Armazenamento.redefinir(window.DADOS_INICIAIS);
      ui.comentariosAbertos.clear();
      irPara('#/inicio');
      aviso('Dados de São Luís restaurados com sucesso!');
    },
    'filtrar'(el) {
      ui.filtro = el.dataset.valor || 'Todas';
      if (location.hash !== '#/inicio' && location.hash !== '#/' && location.hash !== '') {
        irPara('#/inicio');
      } else {
        renderizar();
      }
    },
    'limpar-busca'() {
      ui.busca = '';
      const input = document.getElementById('input-busca-global');
      if (input) input.value = '';
      renderizar();
    },
    'focar-busca'() {
      const focar = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const input = document.getElementById('input-busca-global');
        if (input) input.focus({ preventScroll: true });
      };
      if (location.hash !== '#/inicio' && location.hash !== '#/' && location.hash !== '') {
        irPara('#/inicio');
        setTimeout(focar, 80);
      } else {
        focar();
      }
    },
    'ver-detalhe'(el) {
      const id = el.dataset.id;
      if (id) abrirModalDetalhes(id);
    },
    'nova-obra'() { abrirModalObra(null); },
    'editar-obra'(el, e) {
      if (e) e.stopPropagation();
      abrirModalObra(el.dataset.id);
    },
    'excluir-obra'(el, e) {
      if (e) e.stopPropagation();
      const p = db.posts.find(x => x.id === el.dataset.id);
      if (!p || p.autorId !== db.sessao) return;
      if (!confirm('Tem certeza que deseja excluir a obra "' + p.titulo + '"?')) return;
      db.posts = db.posts.filter(x => x.id !== p.id);
      salvar();
      fecharModal();
      renderizar();
      aviso('Obra excluída com sucesso.');
    },
    'curtir'(el, e) {
      if (e) e.stopPropagation();
      const eu = usuarioAtual();
      if (!eu) {
        aviso('Cadastre-se ou entre na sua conta para curtir as obras!');
        return;
      }
      const p = db.posts.find(x => x.id === el.dataset.id);
      if (!p) return;
      const i = p.curtidas.indexOf(db.sessao);
      if (i >= 0) p.curtidas.splice(i, 1);
      else p.curtidas.push(db.sessao);
      salvar();
      if (ui.obraDetalheId) abrirModalDetalhes(ui.obraDetalheId);
      else renderizar();
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
        setTimeout(() => {
          const el = document.getElementById('pf-nome');
          if (el) el.focus({ preventScroll: true });
        }, 300);
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

  document.addEventListener('input', e => {
    if (e.target && e.target.id === 'input-busca-global') {
      ui.busca = e.target.value;
      // Debounce rápido para busca em tempo real
      clearTimeout(window._timerBusca);
      window._timerBusca = setTimeout(() => {
        if (location.hash !== '#/inicio' && location.hash !== '#/' && location.hash !== '') {
          irPara('#/inicio');
        } else {
          renderizar();
          const inputAtual = document.getElementById('input-busca-global');
          if (inputAtual) {
            inputAtual.focus();
            inputAtual.setSelectionRange(inputAtual.value.length, inputAtual.value.length);
          }
        }
      }, 150);
    }
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
      if (!email || !d.senha) return mostrarErro(form, 'Preencha seu e-mail e senha.');
      if (!u) return mostrarErro(form, 'E-mail ou senha incorretos.');
      db.sessao = u.id;
      salvar();
      irPara('#/inicio');
      aviso('Bem-vindo(a) de volta, ' + u.nome.split(' ')[0] + '!');
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
        cidade: String(d.cidade || 'São Luís, MA').trim(),
        cor: CORES_AVATAR[db.usuarios.length % CORES_AVATAR.length],
        avatar: null,
        sobre: { historia: '', inspiracoes: '', tecnicas: '' },
        contato: {
          instagram: String(d.instagram || '').trim(),
          whatsapp: String(d.whatsapp || '').trim()
        },
        criadoEm: Date.now()
      };
      db.usuarios.push(u);
      db.sessao = u.id;
      if (!salvar()) return;
      irPara('#/inicio');
      aviso('Perfil criado! Você já pode publicar suas obras no Cultura em Rede.');
    },

    obra(form, d) {
      const titulo = String(d.titulo || '').trim();
      const tecnica = String(d.tecnica || '').trim();
      const descricao = String(d.descricao || '').trim();
      if (!titulo || !tecnica || !descricao) return mostrarErro(form, 'Preencha título, técnica e descrição da obra.');

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
        db.posts.unshift(p); // Coloca a nova obra no topo
        if (!salvar()) { db.posts.shift(); return; }
        ui.filtro = 'Todas';
        aviso('Obra publicada com sucesso na galeria!');
      }
      fecharModal();
      renderizar();
    },

    comentar(form, d) {
      const texto = String(d.texto || '').trim();
      if (!texto) return;
      const eu = usuarioAtual();
      if (!eu) {
        aviso('Entre na sua conta para enviar um comentário.');
        return;
      }
      const p = db.posts.find(x => x.id === form.dataset.id);
      if (!p) return;
      p.comentarios.push({ id: novoId('c'), autorId: db.sessao, texto: texto, criadoEm: Date.now() });
      salvar();
      if (ui.obraDetalheId) abrirModalDetalhes(ui.obraDetalheId);
      else renderizar();
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
      aviso('Perfil de produtor atualizado.');
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
