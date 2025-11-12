leia @README.md @fluxo @novo-fluxo.md @package.json @README-admin.md @debugging-method.mdc @debugging-strategies-agent.mdc

Vamos preparar uma lista de coisas para terminar esse sistema todo!
Na home @page.tsx temos o form, remova os avisos em vermelho escrito "Please review this field.", não precisamos, temos outras formas de fazer isso já;
os prompts

global system

toast

colocar o toast no lado esquerdo inferior

---

# Home

os prompts: temos dois prompts padrões, preciso adicionar agentes/vars

bulk prompts (cta and function): Connect CRM e Upload CSV
desabilitar Connect CRM

Botões de "?" do header e flutuante na home

Btn e sistema de login e sign up com redirect para o admin caso login

---

# admin (sidebar + header + main > ( tiles, contacts, notes, files ) + prompt's templates + guest mode + auth mode

Admin

bg main color: o user pode escolher o bg, o admin ta dividido entre sidebar e o resto, esse bg ... vai ficar atrás de tudo, tipo num body, ou um wrapper de tudo... ai atualmente o sidebar left tá com um bg cinzinha claro no fundo e o resto ali central tem um cinzinha mais claro ainda. O q quero fazer é tornar um pouco mais escuro o sidebar e um pouco com opacidade, na proporção correta para ficar mais ou menos a mesma cor no efeito sobrepondo o cincinha mais claro, ai fica mais ou menos visualmente pro user o mesmo cinza e não um cinza com opacidade sabe... pq isso? pq daí qndo o user adicionar uma cor, automaticamente esse efeito dará uma 'cor' a mais ao sidebar. entende o pq tem q fazer as cores super inteligentes pois serão dinâmicas, dá pra escolher a cor do bg do fundo de todo o admin, mas dependendo da cor escolhida pelo user, os títulos tbm podem ficar escuros demais numa cor escura e não dar contraste e ficar ruim a leitura. então a pessoa pode acertar o bg e o contraste (nesse darkmode) dos títulos dessa parte central. ficam pretos ou brancos

/doc modal
o chat dentro do tile card modal doc não está funcionando, eu digitei minha interação e deu falha
Failed to load resource: the server responded with a status of 502 ():https://dashmasterpro.vercel.app/api/workspace/tiles/tile_885e9a0d-c011-44d0-9d11-d6bac2a13bae/chat

esse chat pode ter o envio de anexo, então caso algo for anexado, o modal do anexo vai abrir, é importante que esse anexo seja enviado para a ia com o prompt, ou seja, tenho q fazer um upload pro chatgpt

---

Prompt templates

Sidebar (hearder (company researched + hamburger icon) + Menus (social n shares + Companies/also entities/also workspaces + Contacts + Profile + Settings)

- o menu sidebar recolhido tem o hambuguer (- hambuguer sem cursor hover de click = pointer) e outros itens, o hamburgues está desalinhado com os outros itens e vice e versa
- Profile (clerk)
- Settings ? abrir modal, mas não sei quais são as settings q podemos ter não

- no sidebar os links devem ter titles compreensíveis

ícones do sidebar

- /images/coin.svg add ícone na frente de earn credits, num tamanho legal, e remover o "+" não quero ele ai
- invite friends remover o "+" não quero ele ai
- suggest friend remover o "+" não quero ele ai
- /images/company.svg ícone na frente de companies só add o ícone na frente só, num tamanho legal
- /images/contact.svg e ícone na frente de contacts só add o ícone na frente só, num tamanho legal

Header

/sistema de bg color e dark mode com data persistent

- inserir icone de color picker e abrir modal pra escolher uma cor
- salvar no workspace
- guest mode: botões de login e signup

/sistema de dashboards
cada user tem vários workspaces para várias empresas, mas o user oumesmo o guest, pode optar em ter um dashboard

- dashboard
  -- tem q ter 'Create Blank Dashboard' e os dashboards salvos no workspace
  --- o q são os dashboards: são um template de prompts, assim como já temos 2 templates padrões de prompts que são enviados e viram todo esse dashboard com essas respostas específicas, o user tem q poder organizar do jeito dele, quantidade, ordem, prompt, e também se o prompt vai carregar as infos do user como nome da empresa e o que a empresa faz, se vai consultar o site do user (isso exige um outro modelo que não o gpt-5-mini q usamos pq essee não faz consulta, vai exigir grande adaptação isso) e ainda escolher tamanho da resposta (algo como curta, médi, longa, pode ser um elemento de range)
  -- tem q ter os dois promtps templates a disposição no criar dashboards além dos que o user criar tbm
  -- tem q ter Save as a Template (para a organização atual, com um tipo de view para visualizar o que está sendo salvo né)..

# Main

na main temos algumas coisas q podemos padronizar como titulo sem padrágrafo logo em seguida, só o título da seção (AI Insight Tiles
, Target contacts, Deal notes, e Files & Assets) e remover o paragrafo dos tiles e paragrafo do contacts do deal notes e file assets.

/ AI Insight Tiles, single prompt

/ o tile card

- o header do card é bg branco
- o main do card é cinzinha clarinho

para as outras seções do main

- todos eles tem que seguir o padrão titulo, paragrafo, parte para adicionar um novo da largura de um "card" (para tiles de principais contacts, pra Notes, e até para file e assets, o tamanho de card eu estou falando da largura sabe ali só desses que tem adicionar.
  entende? agora cada um tem uma coisa, um tem um espaço dizendo "No contacts saved yet. Use “Add contact” to capture stakeholders for this workspace." em um border tracejado com bg claro, ai o deal notes vem uma caixinha com um adicionador de notes, e o box "No notes yet. Use this space to log signals, objections and next steps while you review the tiles." (ente4nde como é um diferente do outro e como é redundante?). não precisa desses pequenos avisos tipo "All notes stay attached to this workspace", então pra remover são os parágrafos após o titulo, as caixinhas de box só com texto dentro, e o textinho dentro dos boxes. o contact pode voltar e colocar o form no main tbm.. pra ficar padronizado, ai usamos tanto ai como no modal (vindo do sidebar) e no main remova 'Add contact', vai ficar esse botão na verdade junto com o form né agora movido ali pra dentro da seção.

para adicionar single tile com consulta única, abrir um modal. add novo tile prompt card: o prompt vai carregar as infos do user como nome da empresa e o que a empresa faz, se vai consultar o site do user (isso exige um outro modelo que não o gpt-5-mini q usamos pq essee não faz consulta, vai exigir grande adaptação isso) e ainda escolher tamanho da resposta (algo como curta, médio, longa, pode ser um elemento de range)
