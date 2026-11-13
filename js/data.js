/* =========================================================
   Acervo Vivo — dados de demonstração
   Sem banco de dados: estes dados são carregados na primeira
   visita e depois ficam salvos no localStorage do navegador.
   Todas as pessoas abaixo são fictícias.
   ========================================================= */

window.DADOS_INICIAIS = (function () {
  const agora = Date.now();
  const hora = 60 * 60 * 1000;
  const dia = 24 * hora;

  const usuarios = [
    {
      id: 'u_maria',
      nome: 'Maria das Graças Silva',
      email: 'maria@acervovivo.com',
      senha: '123456',
      oficio: 'Ceramista · figuras em barro',
      cidade: 'Caruaru, PE',
      cor: '#B5532F',
      avatar: null,
      sobre: {
        historia: 'Aprendi a mexer no barro aos nove anos, sentada no chão da casa da minha avó, no Alto do Moura. Ela fazia panelas para vender na feira e eu ficava modelando bichinhos com as sobras.\n\nHoje faço figuras que contam o dia a dia do sertão: o vaqueiro, a rendeira, o forró de pé de serra. Cada peça leva de três a cinco dias entre modelar, secar à sombra e queimar no forno a lenha.',
        inspiracoes: 'A feira de Caruaru, as histórias que meu pai contava das vaquejadas e os mestres do barro que vieram antes de mim e abriram caminho para a nossa arte ser reconhecida.',
        tecnicas: 'Barro vermelho do rio Ipojuca, modelagem à mão livre, secagem natural, queima em forno a lenha e pintura com pigmentos de terra.'
      },
      contato: { instagram: '@maria.dobarro', whatsapp: '' },
      criadoEm: agora - 400 * dia
    },
    {
      id: 'u_ana',
      nome: 'Ana Lúcia Ferreira',
      email: 'ana@acervovivo.com',
      senha: '123456',
      oficio: 'Rendeira de bilro',
      cidade: 'Aquiraz, CE',
      cor: '#2F4A6B',
      avatar: null,
      sobre: {
        historia: 'Sou da quarta geração de rendeiras da minha família. A almofada que uso foi da minha bisavó e ainda guarda os furinhos dos piques que ela marcou.\n\nParticipo da associação de rendeiras da Prainha, onde ensinamos meninas e meninos para que o bilro não pare de cantar.',
        inspiracoes: 'O mar, as flores do cajueiro e as conversas das rendeiras na calçada no fim da tarde.',
        tecnicas: 'Renda de bilro com linha de algodão, piques desenhados em papelão, almofada cheia de capim seco.'
      },
      contato: { instagram: '@rendasdaana', whatsapp: '' },
      criadoEm: agora - 300 * dia
    },
    {
      id: 'u_raimundo',
      nome: 'Raimundo Nonato Sousa',
      email: 'raimundo@acervovivo.com',
      senha: '123456',
      oficio: 'Cesteiro · palha de carnaúba',
      cidade: 'Parnaíba, PI',
      cor: '#5B7553',
      avatar: null,
      sobre: {
        historia: 'Comecei tirando palha com meu pai nos carnaubais do delta. Ele trançava chapéus e esteiras; eu fui inventando bolsas, luminárias e cestos de vários tamanhos.',
        inspiracoes: 'A carnaúba, que a gente chama de árvore da vida, porque dela se aproveita tudo.',
        tecnicas: 'Palha de carnaúba seca ao sol, tingimento natural com urucum e casca de cajueiro, trançado manual.'
      },
      contato: { instagram: '', whatsapp: '' },
      criadoEm: agora - 200 * dia
    },
    {
      id: 'u_tereza',
      nome: 'Tereza Medeiros',
      email: 'tereza@acervovivo.com',
      senha: '123456',
      oficio: 'Bordadeira',
      cidade: 'Caicó, RN',
      cor: '#7A3E5C',
      avatar: null,
      sobre: {
        historia: 'O bordado de Caicó chegou para mim pelas mãos da minha mãe. Bordo toalhas, caminhos de mesa e peças de roupa, sempre com as flores e os pássaros do Seridó.',
        inspiracoes: 'O sertão depois da chuva, quando tudo floresce de uma vez.',
        tecnicas: 'Bordado à máquina de pedal e à mão, linha de algodão, riscos desenhados por mim.'
      },
      contato: { instagram: '@terezabordados', whatsapp: '' },
      criadoEm: agora - 150 * dia
    },
    {
      id: 'u_jose',
      nome: 'José Ailton Cavalcante',
      email: 'jose@acervovivo.com',
      senha: '123456',
      oficio: 'Xilogravurista e cordelista',
      cidade: 'Juazeiro do Norte, CE',
      cor: '#9A6B1F',
      avatar: null,
      sobre: {
        historia: 'Comecei fazendo capas para os folhetos de cordel de um tio. Depois a gravura ganhou vida própria e hoje faço também quadros e estampas.',
        inspiracoes: 'As romarias, os santos populares, os bichos do sertão e as histórias contadas em verso.',
        tecnicas: 'Gravura em madeira de imburana, goiva e faca, impressão manual em papel e tecido.'
      },
      contato: { instagram: '', whatsapp: '' },
      criadoEm: agora - 100 * dia
    }
  ];

  const posts = [
    {
      id: 'p_1',
      autorId: 'u_ana',
      titulo: 'Toalha de mesa "Flor de cajueiro"',
      descricao: 'Terminei hoje, depois de quase dois meses na almofada. São mais de 120 bilros trabalhando juntos.\n\nO desenho veio de um pique antigo da minha avó, que eu adaptei com as flores do cajueiro aqui do quintal.',
      tecnica: 'Renda de bilro',
      imagem: null,
      arte: { tipo: 'renda', cores: ['#E9EEF3', '#2F4A6B', '#B5532F'] },
      criadoEm: agora - 3 * hora,
      curtidas: ['u_maria', 'u_tereza', 'u_jose'],
      comentarios: [
        { id: 'c_1', autorId: 'u_tereza', texto: 'Que trabalho lindo, Ana! A paciência das rendeiras é uma coisa de outro mundo.', criadoEm: agora - 2 * hora }
      ]
    },
    {
      id: 'p_2',
      autorId: 'u_maria',
      titulo: 'Vaqueiro aboiando',
      descricao: 'Peça nova para a feira de sábado. O vaqueiro tem 30 cm e foi queimado ontem no forno a lenha.\n\nQuem cresceu no sertão sabe: o aboio é a música do fim de tarde.',
      tecnica: 'Cerâmica',
      imagem: null,
      arte: { tipo: 'ceramica', cores: ['#F3E3CF', '#B5532F', '#2F4A6B'] },
      criadoEm: agora - 20 * hora,
      curtidas: ['u_ana', 'u_raimundo'],
      comentarios: []
    },
    {
      id: 'p_3',
      autorId: 'u_jose',
      titulo: 'Matriz para o cordel "O sol do meio-dia"',
      descricao: 'Mostrando a matriz de imburana que vai virar capa do novo folheto. Foram três dias de goiva. A primeira tiragem sai na romaria de novembro.',
      tecnica: 'Xilogravura',
      imagem: null,
      arte: { tipo: 'xilogravura', cores: ['#F4ECDD', '#2B211B', '#B5532F'] },
      criadoEm: agora - 2 * dia,
      curtidas: ['u_maria'],
      comentarios: [
        { id: 'c_2', autorId: 'u_raimundo', texto: 'Esse sol ficou bonito demais!', criadoEm: agora - 1.5 * dia }
      ]
    },
    {
      id: 'p_4',
      autorId: 'u_raimundo',
      titulo: 'Cestos tingidos com urucum',
      descricao: 'Experimentei tingir a palha com urucum e casca de cajueiro. O vermelho ficou mais vivo do que eu esperava. Faço sob encomenda em três tamanhos.',
      tecnica: 'Cestaria',
      imagem: null,
      arte: { tipo: 'cestaria', cores: ['#F1E9D8', '#B5532F', '#D9A441'] },
      criadoEm: agora - 4 * dia,
      curtidas: ['u_ana', 'u_tereza', 'u_maria', 'u_jose'],
      comentarios: []
    },
    {
      id: 'p_5',
      autorId: 'u_tereza',
      titulo: 'Caminho de mesa do Seridó',
      descricao: 'Flores de mandacaru e pássaros galo-de-campina. Este foi encomendado para um casamento em Natal.',
      tecnica: 'Bordado',
      imagem: null,
      arte: { tipo: 'bordado', cores: ['#F6E7D7', '#7A3E5C', '#D9A441'] },
      criadoEm: agora - 6 * dia,
      curtidas: ['u_ana'],
      comentarios: [
        { id: 'c_3', autorId: 'u_maria', texto: 'As cores do sertão florido, Tereza. Coisa mais linda.', criadoEm: agora - 5 * dia }
      ]
    },
    {
      id: 'p_6',
      autorId: 'u_maria',
      titulo: 'Oficina de barro para crianças',
      descricao: 'Ontem recebi uma turma da escola municipal aqui no ateliê. Cada criança levou para casa um bichinho que ela mesma modelou. É assim que a tradição continua.',
      tecnica: 'Cerâmica',
      imagem: null,
      arte: { tipo: 'ceramica', cores: ['#E9E4D6', '#5B7553', '#B5532F'] },
      criadoEm: agora - 9 * dia,
      curtidas: ['u_jose', 'u_ana', 'u_tereza'],
      comentarios: []
    }
  ];

  return { usuarios, posts, sessao: null };
})();
