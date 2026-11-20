/* =========================================================
   Cultura em Rede — dados de demonstração
   Sem banco de dados: estes dados são carregados na primeira
   visita e depois ficam salvos no localStorage do navegador.
   Dedicado aos artesãos e mestres da cultura popular de São Luís, MA.
   ========================================================= */

window.DADOS_INICIAIS = (function () {
  const agora = Date.now();
  const hora = 60 * 60 * 1000;
  const dia = 24 * hora;

  const usuarios = [
    {
      id: 'u_maria',
      nome: 'Maria da Graça Ferreira',
      email: 'maria@culturaemrede.com',
      senha: '123456',
      oficio: 'Azulejaria e Cerâmica Tradicional',
      cidade: 'São Luís, MA · Centro Histórico',
      cor: '#2F4A6B',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      sobre: {
        historia: 'Nasci respirando a arquitetura dos casarões coloniais da Praia Grande. Aprendi a técnica da pintura sobre cerâmica e azulejo com os antigos mestres azulejistas de São Luís.\n\nCada azulejo que produzo é queimado artesanalmente e pintado à mão, resgatando os padrões geométricos e florais portugueses e maranhenses que deram a São Luís o título de Cidade dos Azulejos.',
        inspiracoes: 'Os sobrados e fachadas do Centro Histórico de São Luís, a brisa da Baía de São Marcos e a história viva das nossas ladeiras de pedra de cantaria.',
        tecnicas: 'Cerâmica esmaltada, queima a alta temperatura, pintura à mão livre com pigmentos de óxido de cobalto (azul colonial) e terra vermelha.'
      },
      contato: { instagram: '@mariadosazulejos.slz', whatsapp: '(98) 98123-4567' },
      criadoEm: agora - 420 * dia
    },
    {
      id: 'u_raimundo',
      nome: 'Mestre Raimundo Nonato',
      email: 'raimundo@culturaemrede.com',
      senha: '123456',
      oficio: 'Artesão em Fibra de Buriti e Cestaria',
      cidade: 'São Luís, MA · Madre Deus',
      cor: '#5B7553',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      sobre: {
        historia: 'Trabalho a palha de buriti há mais de quarenta anos. Aprendi o trançado na beira dos igarapés com meus tios e trouxe a técnica para a Madre Deus, berço do artesanato de São Luís.\n\nDo buriti aproveitamos tudo: o linho da folha nova para bolsas e luminárias finas, e a tala para os cestos firmes e resistentes que abastecem as feiras.',
        inspiracoes: 'Os palmeirais dos lençóis e baixadas maranhenses, a força da mãe natureza e os ritmos de tambor de crioula que embalam nossos finais de semana.',
        tecnicas: 'Extração sustentável do olho do buriti, secagem ao sol, desfibramento manual, tingimento com casca de cebola e urucum, e tecelagem em tear de pregos.'
      },
      contato: { instagram: '@mestre.raimundo.buriti', whatsapp: '(98) 98877-1122' },
      criadoEm: agora - 350 * dia
    },
    {
      id: 'u_tereza',
      nome: 'Dona Tereza de Jesus',
      email: 'tereza@culturaemrede.com',
      senha: '123456',
      oficio: 'Bordadeira de Bumba Meu Boi',
      cidade: 'São Luís, MA · Monte Castelo',
      cor: '#7A3E5C',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      sobre: {
        historia: 'Bordo os couros e arandelas do Bumba Meu Boi desde menina. O boi maranhense é a coisa mais rica do mundo: cada pedraria, miçanga e canutilho é costurado com amor e devoção a São João e São Pedro.\n\nAlém dos bois para os grupos de sotaque de matraca e zabumba, faço quadros decorativos, estandartes e coletes bordados sob medida.',
        inspiracoes: 'As noites de São João no Maranhão, o brilho dos bordados no escuro dos arraiais e a lenda de Catirina e Pai Francisco.',
        tecnicas: 'Veludo preto forrado, risco original maranhense, bordado com vidrilhos, canutilhos brilhantes, miçangas douradas e aplicação manual ponto a ponto.'
      },
      contato: { instagram: '@tereza.boibordados', whatsapp: '(98) 98455-3344' },
      criadoEm: agora - 280 * dia
    },
    {
      id: 'u_ana',
      nome: 'Ana Lúcia Raposo',
      email: 'ana@culturaemrede.com',
      senha: '123456',
      oficio: 'Rendeira de Bilro e Fios Maranhenses',
      cidade: 'São Luís, MA · Praia Grande',
      cor: '#B5532F',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      sobre: {
        historia: 'Nossa família veio do litoral da Raposa para montar ateliê na Praia Grande em São Luís. A renda de bilro é a melodia das madeiras batendo ritmadas na almofada cheia de palha.\n\nCrio caminhos de mesa, toalhas, golas e adornos com fios finos de puro algodão. São peças que atravessam gerações nas casas maranhenses.',
        inspiracoes: 'O balanço das ondas do mar de São Marcos, a renda da espuma das marés e a cantoria das rendeiras no fim de tarde.',
        tecnicas: 'Renda de bilro tradicional, almofada de feno de arroz, piques perfurados em papelão artesanal e fios 100% algodão cru.'
      },
      contato: { instagram: '@anaraposobiro', whatsapp: '(98) 98233-8899' },
      criadoEm: agora - 210 * dia
    },
    {
      id: 'u_jose',
      nome: 'José Ribamar Silva',
      email: 'jose@culturaemrede.com',
      senha: '123456',
      oficio: 'Xilogravurista e Escultor em Madeira',
      cidade: 'São Luís, MA · Desterro',
      cor: '#9A6B1F',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      sobre: {
        historia: 'Cresci pelas oficinas de marcenaria naval e entalhe do Desterro. Comecei entalhando carrancas e ilustrando folhetos de cordel das lendas ludovicenses, como a Serpente Encantada e a Carruagem de Ana Jansen.\n\nHoje minhas matrizes viram gravuras em papel algodão e relevos de madeira de demolição que contam as memórias de São Luís.',
        inspiracoes: 'As lendas urbanas de São Luís, a poesia popular maranhense e as embarcações típicas da nossa costa.',
        tecnicas: 'Entalhe em jacarandá e cedro reciclado, matriz de xilogravura esculpida a goiva manual, tinta tipográfica e impressão manual em papel artesanal.'
      },
      contato: { instagram: '@ribamar.xilografia', whatsapp: '(98) 98765-4321' },
      criadoEm: agora - 140 * dia
    }
  ];

  const posts = [
    {
      id: 'p_1',
      autorId: 'u_maria',
      titulo: 'Painel Azulejo Colonial "Rosas de São Luís"',
      descricao: 'Painel com 4 azulejos artesanais de 15x15 cm inspirados nos sobradões da Rua Portugal. Pintados à mão com óxido de cobalto sobre esmalte cru e queimados a 1000°C.\n\nPerfeito para decoração de interiores e áreas gourmet. Peça única!',
      tecnica: 'Azulejaria',
      imagem: 'https://images.unsplash.com/photo-1597655601841-214a4cfe8b2c?auto=format&fit=crop&w=800&q=80',
      arte: { tipo: 'ceramica', cores: ['#F3E3CF', '#2F4A6B', '#B5532F'] },
      criadoEm: agora - 2 * hora,
      curtidas: ['u_tereza', 'u_raimundo', 'u_ana'],
      comentarios: [
        { id: 'c_1', autorId: 'u_tereza', texto: 'Que lindeza de azul, Maria! Lembra a fachada da Casa das Tulhas.', criadoEm: agora - 1 * hora }
      ]
    },
    {
      id: 'p_2',
      autorId: 'u_tereza',
      titulo: 'Couro Bordado do Boi "Estrela da Noite"',
      descricao: 'Frente de couro para boi em miniatura, totalmente bordada em canutilhos de vidro, vidrilhos e miçangas furta-cor sobre veludo alemão.\n\nForam 3 semanas de ponto a ponto para capturar o brilho dos arraiais juninos de São Luís.',
      tecnica: 'Bordado de Bumba Boi',
      imagem: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80',
      arte: { tipo: 'bordado', cores: ['#F6E7D7', '#7A3E5C', '#D9A441'] },
      criadoEm: agora - 14 * hora,
      curtidas: ['u_maria', 'u_jose', 'u_ana', 'u_raimundo'],
      comentarios: [
        { id: 'c_2', autorId: 'u_jose', texto: 'A riqueza dos detalhes impressiona demais, dona Tereza!', criadoEm: agora - 10 * hora }
      ]
    },
    {
      id: 'p_3',
      autorId: 'u_raimundo',
      titulo: 'Cestaria e Luminária em Linho de Buriti',
      descricao: 'Luminária pendente tecida com o linho da folha jovem do buriti e tingimento natural com casca de cajueiro.\n\nA trama cria um jogo de sombras quente e acolhedor, valorizando a fibra natural maranhense.',
      tecnica: 'Fibra de Buriti',
      imagem: 'https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=800&q=80',
      arte: { tipo: 'cestaria', cores: ['#F1E9D8', '#B5532F', '#D9A441'] },
      criadoEm: agora - 1 * dia,
      curtidas: ['u_maria', 'u_ana'],
      comentarios: []
    },
    {
      id: 'p_4',
      autorId: 'u_ana',
      titulo: 'Caminho de Mesa "Ondas da Ponta d’Areia"',
      descricao: 'Caminho de mesa em renda de bilro tradicional feito com 140 bilros de madeira e linha 100% algodão.\n\nPique exclusivo inspirado no movimento das marés da Baía de São Marcos. Mede 1,20m de puro requinte manual.',
      tecnica: 'Renda de Bilro',
      imagem: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=800&q=80',
      arte: { tipo: 'renda', cores: ['#E9EEF3', '#2F4A6B', '#B5532F'] },
      criadoEm: agora - 3 * dia,
      curtidas: ['u_maria', 'u_tereza', 'u_jose'],
      comentarios: []
    },
    {
      id: 'p_5',
      autorId: 'u_jose',
      titulo: 'Xilogravura "A Serpente Encantada da Ilha"',
      descricao: 'Impressão manual em papel de fibra de bananeira a partir de matriz em madeira nobre recuperada.\n\nRetrata a famosa lenda da serpente que dorme sob São Luís e que abraça a Ilha do Amor. Tiragem limitada numerada e assinada.',
      tecnica: 'Xilogravura',
      imagem: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=800&q=80',
      arte: { tipo: 'xilogravura', cores: ['#F4ECDD', '#2B211B', '#B5532F'] },
      criadoEm: agora - 5 * dia,
      curtidas: ['u_raimundo', 'u_tereza'],
      comentarios: [
        { id: 'c_3', autorId: 'u_ana', texto: 'A lenda mais bonita da nossa Ilha representada com muita maestria!', criadoEm: agora - 4 * dia }
      ]
    },
    {
      id: 'p_6',
      autorId: 'u_raimundo',
      titulo: 'Bolsa Tiracolo em Palha Trançada com Alça de Couro',
      descricao: 'Bolsa estruturada confeccionada à mão com palha de buriti selecionada e acabamento em couro marrom legítimo.\n\nLeve, durável e com a essência do design maranhense contemporâneo.',
      tecnica: 'Fibra de Buriti',
      imagem: 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?auto=format&fit=crop&w=800&q=80',
      arte: { tipo: 'cestaria', cores: ['#F1E9D8', '#5B7553', '#9A6B1F'] },
      criadoEm: agora - 7 * dia,
      curtidas: ['u_ana', 'u_maria', 'u_tereza'],
      comentarios: []
    },
    {
      id: 'p_7',
      autorId: 'u_maria',
      titulo: 'Vaso Maranhense em Barro Vermelho e Caulim',
      descricao: 'Vaso decorativo modelado à mão em torno manual com barro extraído das margens do Rio Anil.\n\nPintura em caulim branco com grafismos rupestres encontrados em sítios arqueológicos maranhenses.',
      tecnica: 'Cerâmica',
      imagem: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
      arte: { tipo: 'ceramica', cores: ['#E9E4D6', '#5B7553', '#B5532F'] },
      criadoEm: agora - 10 * dia,
      curtidas: ['u_jose', 'u_raimundo'],
      comentarios: []
    },
    {
      id: 'p_8',
      autorId: 'u_tereza',
      titulo: 'Estandarte de São João em Veludo e Miçangas',
      descricao: 'Estandarte tradicional para celebração de São João e São Pedro, feito com detalhes em fios dourados, apliques de lantejoulas e miçangas maranhenses.\n\nUm tributo de fé e tradição que ilumina qualquer ambiente.',
      tecnica: 'Bordado de Bumba Boi',
      imagem: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      arte: { tipo: 'bordado', cores: ['#F6E7D7', '#7A3E5C', '#D9A441'] },
      criadoEm: agora - 12 * dia,
      curtidas: ['u_maria', 'u_ana', 'u_jose'],
      comentarios: []
    }
  ];

  return { usuarios, posts, sessao: null };
})();
