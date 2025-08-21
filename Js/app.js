/* ================= CONFIG ================= */
const THEME = {
    POINTS_TARGET: 20000,
    REDEEM_ZERO_ALL: false
  };

// Chave de acesso para o painel admin (só você saberá)
const ADMIN_ACCESS_KEY = 'erik_cunha_estudio23_2024_admin';

// Planos de assinatura disponíveis
const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Plano Mensal',
    price: 119.99,
    duration: 30, // dias
    benefits: {
      lavagemSimples: 2,
      desconto: 15,
      pontosBonus: 800
    }
  },
  monthlyPlus: {
    id: 'monthlyPlus',
    name: 'Plano Mensal Plus',
    price: 224.99,
    duration: 30, // dias
    benefits: {
      lavagemSimples: 4,
      desconto: 20,
      pontosBonus: 1500
    }
  }
};
  
  // Variáveis globais para controlar o mês atual no calendário
  let calendarCurrentMonth = new Date().getMonth();
  let calendarCurrentYear = new Date().getFullYear();
  
  const SERVICES = [
    {id:'lavagem_simples', nome:'Lavagem Simples', preco:70.00, pontos:1000, img:'public/services/lavagem_simples.png'},
    {id:'lavagem_detalhada', nome:'Lavagem Detalhada', preco:100.00, pontos:1500, img:'public/services/lavagem_detalhada.png'},
    {id:'higienizacao_5', nome:'Higienização Interna (5 lugares)', preco:450.00, pontos:3500, img:'public/services/higenizacao.png'},
    {id:'higienizacao_7', nome:'Higienização Interna (7 lugares)', preco:600.00, pontos:4000, img:'public/services/higenizacao.png'},
    {id:'lavagem_moto', nome:'Lavagem Moto Detalhada', preco:50.00, pontos:800, img:'public/services/lavagem_simples.png'},
    {id:'polimento', nome:'Polimento Técnico (a partir de)', preco:450.00, pontos:5000, img:'public/services/polimento.png', obs:'Sujeito a análise no WhatsApp'},
    {id:'vitrificacao', nome:'Vitrificação 12m (incluso polimento)', preco:1000.00, pontos:9000, img:'public/services/vitrificacao.png'},
    {id:'enceramento', nome:'Enceramento', preco:20.00, pontos:500, img:'public/services/cristalizacao.png', obs:'Proteção e brilho de 1 mês'}
  ];
  
  const REWARDS = [
    {id:'r_lav_simples',   name:'Lavagem Simples GRÁTIS',     cost:20000},
    {id:'r_lav_detalhada', name:'Lavagem Detalhada GRÁTIS',   cost:35000},
    {id:'r_motor',         name:'Lavagem de Motor GRÁTIS',    cost:50000},
    {id:'r_hig',           name:'Higienização Interna GRÁTIS',cost:80000}
  ];
  
  /* ================ STORAGE / STATE ================ */
  const url = new URL(location.href);
  const CID_URL = url.searchParams.get('cid');
  const CID_STORE = localStorage.getItem('cid');
  const CID = CID_URL || CID_STORE || 'anon';
  const KEY = (k)=>`ea_${CID}_${k}`;
  
  const state = {
    client: get('client') || null,
    points: Number(localStorage.getItem(KEY('points'))||0) || 0,
    cart: get('cart') || [],
    slots: get('slots') || [],
    history: get('history') || [],
    agendamento: get('agendamento') || null, // Adicionado para armazenar o agendamento escolhido
    buscaLeva: get('buscaLeva') || null, // null = não decidiu, true/false = decidiu
    subscription: get('subscription') || null // Adicionado para armazenar a assinatura
  };
  
  /* ================ UTIL ================ */
  const $ = sel => sel.startsWith('#') ? document.getElementById(sel.slice(1)) : document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);
  const money = v => v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const toast = msg => { const t = $('#toast'); t.textContent = msg; t.style.display='block'; setTimeout(()=>t.style.display='none',2200); };
  function set(k,v){ localStorage.setItem(KEY(k), JSON.stringify(v)); if(k==='points'){ localStorage.setItem(KEY('points'), v); } }
  function get(k){ try{ return JSON.parse(localStorage.getItem(KEY(k))); }catch{ return null; } }
  const maskPhone = p => !p ? '' : '('+p.slice(0,2)+') '+p.slice(2,7)+'-'+p.slice(7,11);
  
  /* ================ FUNÇÕES DE NAVEGAÇÃO DO CALENDÁRIO ================ */
  
  // Funções de navegação do calendário
  function showNextMonth() {
    calendarCurrentMonth++;
    if (calendarCurrentMonth > 11) {
      calendarCurrentMonth = 0;
      calendarCurrentYear++;
    }
    renderAgendaCalendar();
  }
  
  function showPreviousMonth() {
    calendarCurrentMonth--;
    if (calendarCurrentMonth < 0) {
      calendarCurrentMonth = 11;
      calendarCurrentYear--;
    }
    renderAgendaCalendar();
  }
  
  /* ================ BOOT (Splash -> Signup or App) ================ */
  window.addEventListener('load', ()=>{
    // splash screen
    setTimeout(()=>{
      const splash = document.getElementById('splash');
      splash.style.opacity = 0; splash.style.pointerEvents = 'none';
      setTimeout(()=>splash.style.display='none', 380);
      
      // Sempre chamar bootApp para verificar se há cliente salvo
      bootApp();
      

    }, 1600);
  });
  
  /* ================ SIGNUP ================== */
  $('#btnSaveSignup').addEventListener('click', ()=>{
    const name = $('#name').value.trim();
    const phone = $('#phone').value.trim();
    
    if (!name || !phone) {
      toast('Preencha todos os campos');
      return;
    }
    
    // Validar nome completo (pelo menos duas palavras)
    const nameWords = name.split(' ').filter(word => word.length > 0);
    if (nameWords.length < 2) {
      toast('Digite seu nome completo (pelo menos duas palavras)');
      return;
    }
    
    if (phone.length < 10) {
      toast('WhatsApp inválido');
      return;
    }
    
    // Verificar se já existe um cliente com este telefone
    let existingCid = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('client_')) {
        try {
          const clientData = JSON.parse(localStorage.getItem(key));
          if (clientData.phone === phone) {
            existingCid = key;
            break;
          }
        } catch (e) {
          // Ignorar erros de parse
        }
      }
    }
    
    let cid;
    if (existingCid) {
      // Cliente existente, usar o CID existente
      cid = existingCid;
    } else {
      // Novo cliente, gerar novo CID
      cid = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Salvar/atualizar dados do cliente
    const client = { name, phone, cid };
    localStorage.setItem(cid, JSON.stringify(client));
    localStorage.setItem('cid', cid);
    

    
    // Atualizar estado
    state.client = client;
    
    // Carregar dados salvos se for cliente existente
    if (existingCid) {
      loadClientData();
    } else {
      // Inicializar dados para novo cliente
      state.points = 0;
      state.cart = [];
      state.agendamento = null;
      state.buscaLeva = false;
      state.subscription = null;
      state.history = [];
    }
    
    // Salvar dados do cliente
    saveClientData();
    
    // Ocultar tela de login
    $('#signup').classList.add('hidden');
    
    // Atualizar interface
    updateAllUI();
    
    // Verificar e mostrar botão admin
    toggleAdminButton();
    
    // Verificar status do login
    checkLoginStatus();
    
    // Mensagem de boas-vindas
    toast(`Bem-vindo, ${name}!`);
    
    console.log('✅ Login realizado com sucesso:', state.client);
  });
  
  /* ================ APP BOOT ================= */
  function bootApp(){
    console.log('🚀 Iniciando aplicação...');
    
    // Verificar se já existe um cliente logado
    const savedCid = localStorage.getItem('cid');
    console.log('📱 CID salvo:', savedCid);
    
    if (savedCid) {
      const savedClient = localStorage.getItem(savedCid);
      console.log('👤 Cliente salvo:', savedClient);
      
      if (savedClient) {
        try {
          state.client = JSON.parse(savedClient);
          console.log('✅ Cliente carregado:', state.client);
          
          // Carregar todos os dados salvos do cliente
          loadClientData();
          
          // Ocultar tela de login
          const loginScreen = document.getElementById('signup');
          if (loginScreen) {
            loginScreen.classList.add('hidden');
            console.log('✅ Tela de login ocultada');
          }
          
          // Atualizar interface
          updateAllUI();
          
          console.log('✅ Login automático realizado com sucesso!');
          
        } catch (error) {
          console.error('❌ Erro ao carregar dados do cliente:', error);
          // Se der erro, limpar e mostrar login
          localStorage.removeItem('cid');
          showLoginScreen();
        }
      } else {
        // CID existe mas cliente não encontrado
        console.log('❌ CID existe mas cliente não encontrado');
        localStorage.removeItem('cid');
        showLoginScreen();
      }
    } else {
      // Nenhum cliente logado, mostrar tela de login
      console.log('❌ Nenhum cliente logado');
      showLoginScreen();
    }
    
    // Verificar e mostrar botão admin
    toggleAdminButton();
    
    // Verificar status do login
    checkLoginStatus();
    
    // Event listeners
    setupEventListeners();
  }
  
  // Função para mostrar tela de login
  function showLoginScreen() {
    const loginScreen = document.getElementById('signup');
    if (loginScreen) {
      loginScreen.classList.remove('hidden');
      console.log('📱 Tela de login exibida');
    }
  }
  
  // Função para atualizar toda a interface
  function updateAllUI() {
    renderClientChip();
    renderServices();
    renderCart();
    renderPoints();
    renderHistory();
    renderRewards();
    renderSubscriptionStatus();
    renderAgendamentoStatus();
    console.log('🎨 Interface atualizada');
  }
  
  // Função para configurar event listeners
  function setupEventListeners() {

    
    // Atualizar client-chip quando a tela redimensionar
    window.addEventListener('resize', () => {
      renderClientChip();
    });
    
    // Salvar dados automaticamente quando a página for fechada
    window.addEventListener('beforeunload', () => {
      saveClientData();
      console.log('💾 Dados salvos antes de fechar');
    });
    
    // Salvar dados periodicamente (a cada 30 segundos)
    setInterval(() => {
      if (state.client) {
        saveClientData();
        console.log('💾 Salvamento automático realizado');
      }
    }, 30000);
  }
  
  /* ================ UI ACTIONS =================== */
  function attachUIActions(){
    $('#btnClearCart').addEventListener('click', ()=>{ 
      state.cart=[]; 
      set('cart', state.cart); 
      renderCart(); 
      limparAgendamentoTemporario(); // Limpar agendamento se carrinho vazio
    });
    $('#btnShare').addEventListener('click', shareLink);
    $('#btnSaveClient').addEventListener('click', saveClient);
    $('#btnCopyLink').addEventListener('click', copyLink);

  
    $('#payMethod').addEventListener('change', ()=>{
      $('#pixBox').classList.add('hidden'); $('#cardBox').classList.add('hidden');
      if($('#payMethod').value === 'pix') $('#pixBox').classList.remove('hidden');
      if($('#payMethod').value === 'card') $('#cardBox').classList.remove('hidden');
    });
    $('#payMethod').dispatchEvent(new Event('change'));
  }
  
  /* ================ SCROLL / NAV HELP ================ */
  function scrollToSection(id){
    const el = document.getElementById(id);
    if(!el) return;
    el.scrollIntoView({behavior:'smooth', block:'start'});
  }
  
  /* ================ CLIENT / PROFILE ================= */
  function renderClientChip(){
    const clientChip = $('#clientChip');
    if (!clientChip) return;
    
    if (state.client?.name) {
      // Verificar largura da tela para decidir formato
      const isMobile = window.innerWidth <= 480;
      const isSmallMobile = window.innerWidth <= 360;
      
      let displayText;
      if (isSmallMobile) {
        // Para telas muito pequenas, mostrar apenas nome abreviado
        const shortName = state.client.name.split(' ')[0];
        displayText = `${shortName} · ${maskPhone(state.client.phone)}`;
      } else if (isMobile) {
        // Para mobile, mostrar nome completo mas compacto
        displayText = `${state.client.name} · ${maskPhone(state.client.phone)}`;
      } else {
        // Para desktop, mostrar formato completo
        displayText = `${state.client.name} · ${maskPhone(state.client.phone)}`;
      }
      
      clientChip.textContent = displayText;
      clientChip.title = `${state.client.name} · ${state.client.phone}`; // Tooltip com info completa
    } else {
      clientChip.textContent = 'Cliente anônimo';
      clientChip.title = '';
    }
    
    $('#clientName').value = state.client?.name || '';
    $('#clientPhone').value = state.client?.phone || '';
  }
  
  function saveClient(){
    const name = $('#clientName').value.trim();
    const phone = $('#clientPhone').value.replace(/\D/g,'');
    if(!name || phone.length < 10){ toast('Informe nome e WhatsApp válidos'); return; }
    state.client = {name, phone};
    set('client', state.client);
    localStorage.setItem('cid', phone);
    renderClientChip();
    buildPersonalLink();
    toast('Dados salvos');
  }
  
  function buildPersonalLink(){
    const base = location.href.split('?')[0];
    const cid = state.client?.phone || 'anon';
    $('#personalLink').value = `${base}?cid=${encodeURIComponent(cid)}`;
  }
  
  function copyLink(){
    const el = $('#personalLink'); el.select(); el.setSelectionRange(0,99999);
    document.execCommand('copy'); toast('Link copiado');
  }
  
  async function shareLink(){
    const link = $('#personalLink').value || location.href;
    if(navigator.share){
      try { await navigator.share({title:'Estúdio 23', text:'Agende e ganhe pontos', url:link}); }
      catch(e){}
    } else { copyLink(); }
  }
  
  /* ================ PONTOS ================= */
  function renderPoints(){ $('#pointsKpi').textContent = (state.points||0).toLocaleString('pt-BR'); }
  function addPoints(pts){ state.points = (state.points||0) + pts; set('points', state.points); renderPoints(); }
  

  
  function subscribeToPlan(planId) {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) return;
    
    // Verificar se já tem assinatura ativa
    if (state.subscription && state.subscription.active) {
      toast('Você já possui uma assinatura ativa!');
      return;
    }
    
    // Adicionar assinatura ao carrinho
    const subscriptionItem = {
      id: `subscription_${planId}`,
      nome: `Assinatura - ${plan.name}`,
      preco: plan.price,
      pontos: plan.benefits.pontosBonus,
      tipo: 'assinatura',
      planId: planId,
      planDetails: plan
    };
    
    // Verificar se já existe no carrinho
    const existingIndex = state.cart.findIndex(item => item.tipo === 'assinatura');
    if (existingIndex !== -1) {
      // Substituir assinatura existente
      state.cart[existingIndex] = subscriptionItem;
      toast('Assinatura atualizada no carrinho!');
    } else {
      // Adicionar nova assinatura
      state.cart.push(subscriptionItem);
      toast(`${plan.name} adicionado ao carrinho!`);
    }
    
    // Salvar carrinho e atualizar interface
    set('cart', state.cart);
    renderCart();
    
    // Scroll para o carrinho
    setTimeout(() => {
      scrollToSection('sec-cart');
    }, 500);
  }
  
  function renderSubscriptionStatus() {
    const statusBadge = document.getElementById('statusBadgeTop');
    const statusText = document.getElementById('statusTextTop');
    const subscriptionIcon = document.getElementById('subscriptionIconTop');
    
    if (!statusBadge || !statusText || !subscriptionIcon) return;
    
    if (!state.subscription || !state.subscription.active) {
      statusBadge.textContent = 'Sem assinatura';
      statusBadge.className = 'status-badge';
      subscriptionIcon.textContent = '💳';
      statusText.innerHTML = `
        <div style="color: #ccc; line-height: 1.4;">
          Você ainda não possui uma assinatura ativa<br>
          <span style="color: #ff7f00; font-size: 0.9rem;">Clique em "Ver Planos" para conhecer nossos benefícios</span>
        </div>
      `;
      return;
    }
    
    const plan = SUBSCRIPTION_PLANS[state.subscription.planId];
    const endDate = new Date(state.subscription.endDate);
    const now = new Date();
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      // Assinatura expirada
      state.subscription.active = false;
      set('subscription', state.subscription);
      
      statusBadge.textContent = 'Expirada';
      statusBadge.className = 'status-badge expired';
      subscriptionIcon.textContent = '⚠️';
      statusText.innerHTML = `
        <div style="color: #ccc; line-height: 1.4;">
          Sua assinatura <strong>${state.subscription.planName}</strong> expirou<br>
          <span style="color: #ff7f00; font-size: 0.9rem;">Renove para continuar aproveitando os benefícios!</span>
        </div>
      `;
    } else {
      // Assinatura ativa - mostrar detalhes completos
      statusBadge.textContent = 'Ativa';
      statusBadge.className = 'status-badge active';
      subscriptionIcon.textContent = '⭐';
      
      const lavagensRestantes = state.subscription.benefits.lavagemSimples - state.subscription.usedServices.lavagemSimples;
      const lavagensUsadas = state.subscription.usedServices.lavagemSimples;
      
      statusText.innerHTML = `
        <div style="text-align: center; line-height: 1.5;">
          <div style="color: #fff; font-weight: 700; font-size: 1.1rem; margin-bottom: 8px;">
            ${state.subscription.planName}
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; background: rgba(255,127,0,0.1); padding: 8px; border-radius: 8px; border: 1px solid rgba(255,127,0,0.2);">
            <div style="text-align: left;">
              <div style="color: #28a745; font-weight: 600; font-size: 0.9rem;">✓ ${daysLeft} dias restantes</div>
              <div style="color: #ff7f00; font-weight: 600; font-size: 0.9rem;">🎁 ${state.subscription.benefits.desconto}% OFF em todos os serviços</div>
            </div>
            <div style="text-align: right;">
              <div style="color: #28a745; font-weight: 600; font-size: 0.9rem;">⭐ ${state.subscription.benefits.pontosBonus} pts bônus</div>
              <div style="color: #ff7f00; font-weight: 600; font-size: 0.9rem;">📅 Agendamento prioritário</div>
            </div>
          </div>
          
          <div style="background: rgba(40, 167, 69, 0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(40, 167, 69, 0.3);">
            <div style="color: #28a745; font-weight: 700; margin-bottom: 6px;">🚗 Lavagens Simples</div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
              <span style="color: #ccc;">Usadas: ${lavagensUsadas}</span>
              <span style="color: #28a745; font-weight: 600;">Restantes: ${lavagensRestantes}</span>
            </div>
            <div style="background: #333; height: 6px; border-radius: 3px; margin-top: 6px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #28a745, #20c997); height: 100%; width: ${(lavagensUsadas / state.subscription.benefits.lavagemSimples) * 100}%; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>
      `;
    }
  }
  
  function checkSubscriptionBenefits(serviceId) {
    if (!state.subscription || !state.subscription.active) return false;
    
    const plan = SUBSCRIPTION_PLANS[state.subscription.planId];
    
    // Verificar se o serviço está disponível na assinatura
    if (serviceId === 'lavagem_simples' && state.subscription.usedServices.lavagemSimples < state.subscription.benefits.lavagemSimples) {
      return { available: true, type: 'free', discount: 0 };
    }
    
    // Aplicar desconto em todos os serviços
    return { available: false, type: 'discount', discount: state.subscription.benefits.desconto };
  }
  
  function useSubscriptionService(serviceId) {
    if (!state.subscription || !state.subscription.active) return false;
    
    if (serviceId === 'lavagem_simples' && state.subscription.usedServices.lavagemSimples < state.subscription.benefits.lavagemSimples) {
      state.subscription.usedServices.lavagemSimples++;
      set('subscription', state.subscription);
      renderSubscriptionStatus();
      return true;
    }
    
    return false;
  }
  
  function activateSubscription(planId) {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) return;
    
    // Criar nova assinatura
    const now = new Date();
    const endDate = new Date(now.getTime() + (plan.duration * 24 * 60 * 60 * 1000));
    
    state.subscription = {
      planId: planId,
      planName: plan.name,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      active: true,
      benefits: {
        lavagemSimples: plan.benefits.lavagemSimples,
        desconto: plan.benefits.desconto,
        pontosBonus: plan.benefits.pontosBonus
      },
      usedServices: {
        lavagemSimples: 0
      }
    };
    
    // Salvar no localStorage
    set('subscription', state.subscription);
    
    // Adicionar pontos bônus
    addPoints(plan.benefits.pontosBonus);
    
    // Atualizar interface
    renderSubscriptionStatus();
    
    toast(`Assinatura ${plan.name} ativada com sucesso! +${plan.benefits.pontosBonus} pontos bônus`);
  }
  
  /* ================ SERVIÇOS & CARRINHO ================= */
  function renderServices(){
    const box = $('#servicesList'); box.innerHTML='';
    SERVICES.forEach(s=>{
      const el = document.createElement('div'); el.className = 'service-card';
      
      // Verificar benefícios da assinatura
      const subscriptionBenefit = checkSubscriptionBenefits(s.id);
      let priceDisplay = money(s.preco);
      let benefitText = '';
      
      if (subscriptionBenefit) {
        if (subscriptionBenefit.type === 'free') {
          priceDisplay = '<span style="color: #28a745; font-weight: bold;">GRÁTIS</span>';
          benefitText = '<div style="color: #28a745; font-size: 0.9rem; margin-top: 4px;">✓ Incluso na assinatura</div>';
        } else if (subscriptionBenefit.type === 'discount') {
          const discountedPrice = s.preco * (1 - subscriptionBenefit.discount / 100);
          priceDisplay = `<span style="text-decoration: line-through; color: #999;">${money(s.preco)}</span> <span style="color: #28a745; font-weight: bold;">${money(discountedPrice)}</span>`;
          benefitText = `<div style="color: #28a745; font-size: 0.9rem; margin-top: 4px;">✓ ${subscriptionBenefit.discount}% OFF com assinatura</div>`;
        }
      }
      
      el.innerHTML = `
        <div class="service-img" style="background-image:url('${s.img}');"></div>
        <div class="service-meta">
          <h4>${s.nome}</h4>
          <div class="service-price">${priceDisplay}</div>
          ${benefitText}
          <div class="service-points">+${s.pontos.toLocaleString('pt-BR')} pts</div>
          ${s.obs ? `<div class="service-obs">${s.obs}</div>` : ''}
        </div>
        <button class="btn primary" onclick="addToCart('${s.id}')">Adicionar</button>
      `;
      box.appendChild(el);
    });
  }
  
  function addToCart(serviceId){
    const service = SERVICES.find(s => s.id === serviceId);
    if (!service) return;
    
    // Verificar se pode usar serviço gratuito da assinatura
    const subscriptionBenefit = checkSubscriptionBenefits(serviceId);
    let finalPrice = service.preco;
    
    if (subscriptionBenefit && subscriptionBenefit.type === 'free') {
      // Serviço gratuito - usar da assinatura
      if (useSubscriptionService(serviceId)) {
        toast(`Serviço ${service.nome} adicionado gratuitamente via assinatura!`);
        return; // Não adicionar ao carrinho, pois é gratuito
      }
    } else if (subscriptionBenefit && subscriptionBenefit.type === 'discount') {
      // Aplicar desconto da assinatura
      finalPrice = service.preco * (1 - subscriptionBenefit.discount / 100);
    }
    
    // Adicionar ao carrinho com preço final
    const cartItem = {
      ...service,
      preco: finalPrice,
      originalPrice: service.preco,
      discountApplied: subscriptionBenefit ? subscriptionBenefit.discount : 0
    };
    
    state.cart.push(cartItem);
    set('cart', state.cart);
    renderCart();
    
    const discountText = subscriptionBenefit && subscriptionBenefit.type === 'discount' 
      ? ` (${subscriptionBenefit.discount}% OFF)` 
      : '';
    
    toast(`${service.nome} adicionado ao carrinho${discountText}`);
  }
  
  function removeFromCart(index) {
    state.cart.splice(index, 1);
    set('cart', state.cart);
    renderCart();
    toast('Item removido do carrinho');
    limparAgendamentoTemporario(); // Limpar agendamento se carrinho ficar vazio
  }
  
  function renderCart(){
    const box = $('#cartList'); box.innerHTML='';
    if(state.cart.length===0){ box.innerHTML='<div class="muted">Carrinho vazio.</div>'; return; }
    
    let total = 0;
    let hasSubscription = false;
    
    state.cart.forEach((item,i)=>{
      const el = document.createElement('div'); el.className='service-card';
      
      if (item.tipo === 'assinatura') {
        // Renderizar assinatura de forma especial
        hasSubscription = true;
        el.innerHTML = `
          <div class="service-img" style="background: linear-gradient(135deg, #ff7f00, #ff9500); display: flex; align-items: center; justify-content: center; color: #000; font-size: 2rem; font-weight: bold;">⭐</div>
          <div class="service-meta">
            <h4>${item.nome}</h4>
            <div class="subscription-details">
              <div class="subscription-benefit">✓ ${item.planDetails.benefits.lavagemSimples} Lavagens Simples</div>
              <div class="subscription-benefit">✓ ${item.planDetails.benefits.desconto}% OFF em todos os serviços</div>
              <div class="subscription-benefit">✓ ${item.planDetails.benefits.pontosBonus} pontos bônus</div>
            </div>
            <div class="service-price">R$ ${money(item.preco)}</div>
          </div>
          <button class="btn danger" onclick="removeFromCart(${i})">Remover</button>
        `;
      } else {
        // Renderizar serviço normal
        el.innerHTML = `
          <div class="service-img" style="background-image:url('${item.img}');"></div>
          <div class="service-meta">
            <h4>${item.nome}</h4>
            <div class="service-price">R$ ${money(item.preco)}</div>
            <div class="service-points">+${item.pontos.toLocaleString('pt-BR')} pts</div>
          </div>
          <button class="btn danger" onclick="removeFromCart(${i})">Remover</button>
        `;
      }
      
      total += item.preco;
      box.appendChild(el);
    });
    
    // Switch de busca e leva
    let buscaSwitch = document.getElementById('buscaSwitch');
    if(!buscaSwitch){
      buscaSwitch = document.createElement('div');
      buscaSwitch.id = 'buscaSwitch';
      buscaSwitch.className = 'busca-switch-row';
      buscaSwitch.innerHTML = `
        <div class="busca-leva-simple">
          <span class="busca-leva-title">Busca e Leva (R$ 4,99)</span>
          <label class='busca-switch ${state.buscaLeva === null ? 'busca-switch-pending' : ''}'>
            <input type='checkbox' id='buscaLevaCheck' ${state.buscaLeva === true ? 'checked' : ''}>
          </label>
        </div>
      `;
      box.parentElement.insertBefore(buscaSwitch, box.parentElement.firstChild);
      document.getElementById('buscaLevaCheck').onchange = (e)=>{
        state.buscaLeva = e.target.checked;
        set('buscaLeva', state.buscaLeva);
        renderCart();
      };
    }
    let busca = state.buscaLeva === true ? 4.99 : 0;
    let totalFinal = total + busca;
    $('#cartTotal').textContent = money(totalFinal);
    
    // Botão de pagamento
    let payBox = document.getElementById('payBoxCustom');
    if(!payBox){
      payBox = document.createElement('div');
      payBox.id = 'payBoxCustom';
      box.parentElement.appendChild(payBox);
      console.log('✅ PayBox criado');
    }
    
    // Texto especial se tiver assinatura
    let subscriptionNote = '';
    if (hasSubscription) {
      subscriptionNote = `
        <div style="margin-bottom: 16px; padding: 12px; background: rgba(255,127,0,0.1); border-radius: 8px; border: 1px solid rgba(255,127,0,0.3);">
          <div style="color: #ff7f00; font-weight: 600; text-align: center;">
            ⭐ Assinatura incluída no pedido! Após o pagamento, sua assinatura será ativada automaticamente.
          </div>
        </div>
      `;
    }
    
    payBox.innerHTML = `
      ${subscriptionNote}
      <div style="margin-top:18px;text-align:center">
        <button class="btn primary" id="btnShowPix">Fazer pagamento</button>
      </div>
    `;
    
    console.log('✅ Botão "Fazer pagamento" criado');
    
    document.getElementById('btnShowPix').onclick = () => {
      console.log('🔄 Botão "Fazer pagamento" clicado!');
      
      // Validação antes de prosseguir para pagamento
      const validacao = validarPagamento();
      if (!validacao.valido) {
        mostrarErroValidacao(validacao.erros);
        return;
      }
      
      scrollToSection('sec-pay');
      setTimeout(()=>{
        mostrarPixPagamento();
        // Desabilitar botão por 20 segundos (sem mostrar contagem)
        let segundosRestantes = 20;
        const countdown20s = setInterval(() => {
          segundosRestantes--;
          if (segundosRestantes <= 0) {
            // Habilitar botão após 20 segundos
            const btn = document.getElementById('btnEnviarPedido');
            if (btn) {
              btn.disabled = false;
              btn.classList.remove('btn-disabled');
              btn.classList.add('btn-success');
              console.log('✅ Botão "Já fiz o pagamento" habilitado!');
            }
            clearInterval(countdown20s);
          }
        }, 1000);
        
        // Contador de 5 minutos para pagamento
        let minutosRestantes = 5;
        let segundosPagamento = 0;
        
        // Mostrar contador de 5 minutos
        const contadorDiv = document.createElement('div');
        contadorDiv.id = 'contadorPagamento';
        contadorDiv.style.cssText = `
          text-align: center;
          margin-top: 16px;
          padding: 12px;
          background: #1a1a1a;
          border-radius: 8px;
          border: 2px solid #ff7f00;
        `;
        contadorDiv.innerHTML = `
          <div style="color: #ff7f00; font-weight: bold; margin-bottom: 8px;">
            ⏰ TEMPO PARA PAGAMENTO
          </div>
          <div style="font-size: 1.5rem; font-weight: bold; color: #fff;">
            ${minutosRestantes}:${segundosPagamento.toString().padStart(2,'0')}
          </div>
          <div style="color: #ccc; font-size: 0.9rem; margin-top: 4px;">
            Após este tempo o pedido será cancelado automaticamente
          </div>
          <div style="margin-top: 16px;">
            <button class="btn btn-disabled" id="btnEnviarPedido" disabled>
              Já fiz o pagamento, enviar pedido para WhatsApp
            </button>
          </div>
        `;
        
        // Inserir contador na seção de pagamento
        const paySection = document.getElementById('sec-pay');
        paySection.appendChild(contadorDiv);
        
        // Contador regressivo de 5 minutos
        const countdown5min = setInterval(() => {
          if (segundosPagamento > 0) {
            segundosPagamento--;
          } else {
            if (minutosRestantes > 0) {
              minutosRestantes--;
              segundosPagamento = 59;
            } else {
              // Tempo esgotado - cancelar pedido
              clearInterval(countdown5min);
              clearInterval(countdown20s);
              
              // Limpar carrinho e agendamento
              state.cart = [];
              state.agendamento = null;
              set('cart', state.cart);
              set('agendamento', state.agendamento);
              
              // Atualizar interface
              renderCart();
              
              // Mostrar aviso de cancelamento
              toast('Tempo esgotado! Pedido cancelado automaticamente.');
              
              // Remover contador
              contadorDiv.remove();
              
              // Voltar para seção de serviços
              setTimeout(() => {
                scrollToSection('sec-services');
              }, 1000);
              
              return;
            }
          }
          
          // Atualizar display do contador
          contadorDiv.querySelector('div:nth-child(2)').textContent = 
            `${minutosRestantes}:${segundosPagamento.toString().padStart(2,'0')}`;
        }, 1000);
        
        // Limpar contadores quando botão for clicado
        const btnEnviar = document.getElementById('btnEnviarPedido');
        if (btnEnviar) {
          console.log('✅ Botão "Já fiz o pagamento" encontrado, configurando...');
          btnEnviar.onclick = () => {
            console.log('🔄 Botão "Já fiz o pagamento" clicado!');
            clearInterval(countdown5min);
            clearInterval(countdown20s);
            contadorDiv.remove();
            enviarPedidoWhatsApp();
          };
        } else {
          console.log('❌ Botão "Já fiz o pagamento" NÃO encontrado!');
        }
        
      }, 400);
    };
  }
  
  function mostrarPixPagamento() {
    let paySection = document.getElementById('sec-pay');
    let pixArea = document.getElementById('pixAreaCustom');
    if(!pixArea){
      pixArea = document.createElement('div');
      pixArea.id = 'pixAreaCustom';
      paySection.appendChild(pixArea);
    }
    pixArea.innerHTML = `<div style="margin-top:18px;text-align:center">
      <div style="font-weight:600;font-size:1.1rem;margin-bottom:8px">Chave Pix:</div>
      <div style="background:#222;padding:10px 14px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:10px">
        <span id="pixKey" class="pix-key">313c9ff3-c491-4f5d-a736-1e6ded382815</span>
        <button class="btn btn-copy-pix" id="btnCopyPix">Copiar</button>
      </div>
      <div style="margin-top:12px;font-size:1rem;color:#ff7f00">Após o pagamento, envie o comprovante no WhatsApp.<br>Os pontos de fidelidade serão adicionados no mesmo dia.</div>
    </div>`;
    document.getElementById('btnCopyPix').onclick = () => {
      navigator.clipboard.writeText('313c9ff3-c491-4f5d-a736-1e6ded382815');
      toast('Chave Pix copiada!');
    };
  }
  
  /* ================ AGENDAMENTO ================= */
  
  /* ================ REWARDS ================= */
  function renderRewards(){
    const box = $('#rewardsList'); box.innerHTML='';
    REWARDS.forEach(r=>{
      const card = document.createElement('div'); card.className='card';
      card.innerHTML = `<div class="row" style="justify-content:space-between;align-items:center">
        <div><strong>${r.name}</strong><div class="muted">Necessário: ${r.cost.toLocaleString('pt-BR')} pts</div></div>
        <div><button class="btn primary">Trocar</button></div>
      </div>`;
      card.querySelector('button').addEventListener('click', ()=>redeem(r.id));
      box.appendChild(card);
    });
  }
  
  function redeem(rewardId){
    const r = REWARDS.find(x=>x.id===rewardId); if(!r) return;
    if((state.points||0) < r.cost){ toast('Pontos insuficientes'); return; }
    if(THEME.REDEEM_ZERO_ALL) state.points = 0; else state.points = (state.points||0) - r.cost;
    set('points', state.points); renderPoints();
    pushHistory({type:'redeem', items: r.name + ' (resgate)', value: 0, pointsDelta: -r.cost});
    toast('Resgate efetuado! Apresente na recepção.');
  }
  
  /* ================ HISTÓRICO ================= */
  function pushHistory(item){
    const rec = Object.assign({id: String(Date.now()), whenISO: new Date().toISOString()}, item);
    state.history.unshift(rec); set('history', state.history); renderHistory();
  }
  function renderHistory(){
    const box = $('#historyList'); box.innerHTML='';
    if(state.history.length===0){ box.innerHTML='<div class="muted">Sem histórico.</div>'; return; }
    state.history.forEach(h=>{
      const d = new Date(h.whenISO);
      const el = document.createElement('div'); el.className='row card';
      el.style.justifyContent='space-between';
      el.innerHTML = `<div><strong>${h.items}</strong><div class="muted">${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div></div>
        <div class="row"><div>${h.value ? 'R$ '+money(h.value) : '-'}</div><div class="pill">${h.pointsDelta>0?'+':''}${h.pointsDelta.toLocaleString('pt-BR')} pts</div></div>`;
      box.appendChild(el);
    });
  }
  
  // Modal de agendamento
  function openAgendaModal() {
    console.log('🚪 Abrindo modal de agendamento...');
    
    const modal = document.getElementById('agendaModal');
    if (!modal) {
      console.log('❌ Modal não encontrado');
      return;
    }
    
    modal.classList.remove('hidden');
    console.log('✅ Modal aberto');
    console.log('🔍 Classes do modal:', modal.className);
    console.log('🔍 Modal visível:', !modal.classList.contains('hidden'));
    
    // Verificar se o botão de confirmação existe
    const btnConfirm = document.getElementById('btnConfirmAgenda');
    if (btnConfirm) {
      console.log('✅ Botão de confirmação encontrado');
      btnConfirm.disabled = true;
      btnConfirm.textContent = 'Selecione uma data primeiro';
    } else {
      console.log('❌ Botão de confirmação NÃO encontrado');
    }
    
    // Renderizar calendário
    renderAgendaCalendar();
    console.log('✅ Calendário renderizado');
    
    // Verificar se os elementos estão visíveis
    setTimeout(() => {
      const calendar = document.getElementById('agendaCalendar');
      const horarios = document.getElementById('agendaHorarios');
      const btnConfirm = document.getElementById('btnConfirmAgenda');
      
      console.log('🔍 Calendário visível:', calendar && !calendar.classList.contains('hidden'));
      console.log('🔍 Horários visível:', horarios && !horarios.classList.contains('hidden'));
      console.log('🔍 Botão confirmação:', btnConfirm ? 'Encontrado' : 'NÃO encontrado');
      console.log('🔍 Altura do modal:', modal.offsetHeight);
      console.log('🔍 Altura do calendário:', calendar ? calendar.offsetHeight : 'N/A');
      console.log('🔍 Altura dos horários:', horarios ? horarios.offsetHeight : 'N/A');
    }, 200);
  }
  function closeAgendaModal() {
    console.log('🚪 Fechando modal de agendamento...');
    
    const modal = document.getElementById('agendaModal');
    if (modal) {
      modal.classList.add('hidden');
      console.log('✅ Modal fechado');
    }
  }
  document.getElementById('btnOpenAgendaModal').onclick = openAgendaModal;
  document.querySelector('.agenda-modal-close').onclick = closeAgendaModal;
  // Confirmar agendamento
  $('#btnConfirmAgenda').addEventListener('click', function() {
    if (!state.agendamento || !state.agendamento.data || !state.agendamento.horario) {
      toast('Selecione uma data e horário primeiro');
      return;
    }
    
    const { data, horario } = state.agendamento;
    
    console.log('✅ Confirmando agendamento:', data, horario);
    
    // Salvar agendamento no estado (apenas reserva temporária)
    state.agendamento = { data, horario };
    
    // NOTA: Não bloquear horários agora - só bloquear após pagamento confirmado
  
  // Salvar agendamento temporário (sem bloquear)
  set('agendamento', state.agendamento);
  
  // Iniciar temporizador de 5 minutos para reserva temporária
  iniciarTemporizadorReserva();
    
    // Atualizar interface
    document.getElementById('agendamentoEscolhido').innerHTML = `
      <div style="background: rgba(255,127,0,0.1); padding: 12px; border-radius: 8px; border: 1px solid var(--brand);">
        <strong>Agendado para:</strong><br>
        ${new Date(data).toLocaleDateString('pt-BR')} às ${horario}
      </div>
    `;
    
    // Fechar modal
    closeAgendaModal();
    
    // Mensagem de sucesso
    toast('Agendamento confirmado com sucesso!');
    
    // Salvar dados automaticamente
    autoSave();
    
    console.log('✅ Agendamento salvo com sucesso');
  });
  // Renderizar calendário de agendamento
  function renderAgendaCalendar() {
    const calendar = document.getElementById('agendaCalendar');
    if (!calendar) return;
    
    const today = new Date();
    
    // Nomes dos meses
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    // Nomes dos dias da semana
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Primeiro dia do mês
    const firstDay = new Date(calendarCurrentYear, calendarCurrentMonth, 1);
    // Último dia do mês
    const lastDay = new Date(calendarCurrentYear, calendarCurrentMonth + 1, 0);
    
    // Dia da semana do primeiro dia (0 = Domingo, 1 = Segunda, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Número total de dias no mês
    const totalDays = lastDay.getDate();
    
    let calendarHTML = `
      <div class="calendar-header">
        <div class="calendar-navigation">
          <button class="btn-nav" onclick="showPreviousMonth()" ${calendarCurrentMonth === today.getMonth() && calendarCurrentYear === today.getFullYear() ? 'disabled' : ''}>
            &lt;
          </button>
          <h3>${monthNames[calendarCurrentMonth]} ${calendarCurrentYear}</h3>
          <button class="btn-nav" onclick="showNextMonth()">
            &gt;
          </button>
        </div>
      </div>
      <div class="calendar-days">
        ${dayNames.map(day => `<div class="day-name">${day}</div>`).join('')}
    `;
    
    // Adicionar espaços vazios para alinhar com os dias da semana
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarHTML += '<div class="day empty"></div>';
    }
    
    // Adicionar os dias do mês
    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(calendarCurrentYear, calendarCurrentMonth, day);
      const dayOfWeek = currentDate.getDay();
      const isToday = day === today.getDate() && calendarCurrentMonth === today.getMonth() && calendarCurrentYear === today.getFullYear();
      const isPast = currentDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Domingo ou Sábado
      const isAvailable = !isPast && !isWeekend && dayOfWeek >= 1 && dayOfWeek <= 5; // Segunda a Sexta
      
      let dayClass = 'day';
      if (isToday) dayClass += ' today';
      if (isPast) dayClass += ' past';
      if (isWeekend) dayClass += ' weekend';
      if (isAvailable) dayClass += ' available';
      
      if (isAvailable) {
        calendarHTML += `
          <div class="${dayClass}" data-day="${day}" onclick="selectDate(${day})">
            ${day}
          </div>
        `;
      } else {
        calendarHTML += `
          <div class="${dayClass}" data-day="${day}">
            ${day}
          </div>
        `;
      }
    }
    
    calendarHTML += '</div>';
    calendar.innerHTML = calendarHTML;
    
    // Selecionar o primeiro dia disponível por padrão
    const firstAvailableDay = Math.max(1, today.getDate());
    if (firstAvailableDay <= totalDays && calendarCurrentMonth === today.getMonth() && calendarCurrentYear === today.getFullYear()) {
      // Aguardar um pouco para o DOM ser renderizado
      setTimeout(() => {
        selectDate(firstAvailableDay);
      }, 100);
    }
  }
  // Selecionar data no calendário
  function selectDate(day) {
    console.log('📅 Data selecionada:', day);
    
    // Remover seleção anterior
    document.querySelectorAll('.day.selected').forEach(el => el.classList.remove('selected'));
    
    // Selecionar nova data
    const selectedDay = document.querySelector(`.day[data-day="${day}"]`);
    if (selectedDay) {
      selectedDay.classList.add('selected');
    }
    
    // Formatar data para renderizar horários (corrigindo o problema do dia anterior)
    const today = new Date();
    const selectedDate = new Date(calendarCurrentYear, calendarCurrentMonth, day);
    
    // Usar a data exata sem conversão de fuso horário
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;
    
    console.log('📅 Data selecionada (dia):', day);
    console.log('📅 Data objeto:', selectedDate);
    console.log('📅 Data formatada (YYYY-MM-DD):', formattedDate);
    
    // Renderizar horários para a data selecionada
    renderAgendaHorarios(formattedDate);
    
    // Habilitar botão de confirmação
    const btnConfirm = document.getElementById('btnConfirmAgenda');
    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.textContent = 'Selecione um horário para continuar';
      console.log('✅ Botão de confirmação habilitado');
    } else {
      console.log('❌ Botão de confirmação não encontrado');
    }
  }
  
  // Renderizar horários disponíveis para a data selecionada
  function renderAgendaHorarios(dataSelecionada) {
    console.log('🕐 Renderizando horários para:', dataSelecionada);
    
    const horariosBox = document.getElementById('agendaHorarios');
    if (!horariosBox) {
      console.log('❌ Horários box não encontrado');
      return;
    }
    
    console.log('✅ Horários box encontrado, renderizando...');
    
    // Horários de funcionamento: 7:00 às 17:00 (intervalos de 1 hora)
    const horarios = [];
    for (let hora = 7; hora <= 17; hora++) {
      const horario = `${hora.toString().padStart(2, '0')}:00`;
      horarios.push(horario);
    }
    
    console.log('🕐 Horários gerados:', horarios);
    
    // Buscar horários já ocupados para esta data
    const agendamentosGlobais = JSON.parse(localStorage.getItem('agendamentosGlobais') || '[]');
    const horariosOcupados = agendamentosGlobais
      .filter(ag => ag.data === dataSelecionada)
      .map(ag => ag.horario);
    
    console.log('📅 Horários ocupados:', horariosOcupados);
    
    // Formatar data para exibição (corrigindo o problema do dia anterior)
    const [year, month, day] = dataSelecionada.split('-').map(Number);
    const dataObj = new Date(year, month - 1, day); // month - 1 porque Date usa 0-11 para meses
    
    const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    console.log('📅 Data para exibição:', dataFormatada);
    console.log('📅 Data original:', dataSelecionada);
    console.log('📅 Data objeto criado:', dataObj);
    
    let horariosHTML = `
      <div class="horarios-header">
        <h4>Horários Disponíveis</h4>
        <p style="color: var(--brand); font-weight: 600; margin: 8px 0 0 0;">${dataFormatada}</p>
      </div>
      <div class="horarios-grid">
    `;
    
    horarios.forEach(horario => {
      // Verificar se o horário está ocupado
      const isOcupado = isHorarioOcupado(horario, horariosOcupados);
      const isAvailable = !isOcupado;
      
      let horarioClass = 'horario-item';
      if (isOcupado) horarioClass += ' ocupado';
      if (isAvailable) horarioClass += ' disponivel';
      
      horariosHTML += `
        <div class="${horarioClass}" onclick="${isAvailable ? `selectHorario('${horario}', '${dataSelecionada}')` : ''}">
          ${horario}
        </div>
      `;
    });
    
    horariosHTML += '</div>';
    horariosBox.innerHTML = horariosHTML;
    
    console.log('✅ Horários renderizados com sucesso');
    console.log('🔍 HTML dos horários:', horariosBox.innerHTML);
    console.log('🔍 Elementos encontrados:', horariosBox.querySelectorAll('.horario-item').length);
  }
  
  // Verificar se um horário está ocupado
  function isHorarioOcupado(horario, horariosOcupados) {
    // Para intervalos de 1 hora, apenas verificar se o horário exato está ocupado
    return horariosOcupados.includes(horario);
  }
  
  // Selecionar horário
  function selectHorario(horario, data) {
    console.log('🕐 Horário selecionado:', horario, 'para data:', data);
    
    // Remover seleção anterior
    document.querySelectorAll('.horario-item.selected').forEach(el => el.classList.remove('selected'));
    
    // Selecionar novo horário
    const selectedHorario = document.querySelector(`.horario-item[onclick*="${horario}"]`);
    if (selectedHorario) {
      selectedHorario.classList.add('selected');
    }
    
    // Salvar seleção
    state.agendamento = { data, horario };
    
    // Atualizar botão de confirmação
    const btnConfirm = document.getElementById('btnConfirmAgenda');
    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.textContent = `Confirmar: ${new Date(data).toLocaleDateString('pt-BR')} às ${horario}`;
      console.log('✅ Botão de confirmação atualizado e habilitado');
    } else {
      console.log('❌ Botão de confirmação não encontrado ao selecionar horário');
    }
    
    console.log('✅ Horário selecionado e salvo');
  }
  
  // Calcular total do carrinho
  function calculateTotal() {
    return state.cart.reduce((total, item) => {
      if (item.tipo === 'subscription') {
        return total + item.preco;
      }
      return total + item.preco;
    }, 0);
  }
  
  // Função para validar se pode prosseguir para pagamento
  function validarPagamento() {
    const erros = [];
    
    // Verificar se há serviços no carrinho
    if (!state.cart || state.cart.length === 0) {
      erros.push('❌ Selecione pelo menos um serviço');
    }
    
    // Verificar se há agendamento (obrigatório apenas para pagamento)
    if (!state.agendamento || !state.agendamento.data || !state.agendamento.horario) {
      erros.push('❌ Selecione uma data e horário para o agendamento');
    }
    
    // Verificar se decidiu sobre busca e leva (obrigatório apenas para pagamento)
    if (state.buscaLeva === undefined || state.buscaLeva === null) {
      erros.push('❌ Decida se deseja o serviço de busca e leva');
    }
    
    return {
      valido: erros.length === 0,
      erros: erros
    };
  }
  
  // Função para mostrar notificação de erro
  function mostrarErroValidacao(erros) {
    const mensagem = erros.join('\n');
    
    // Criar notificação de erro
    const notificacao = document.createElement('div');
    notificacao.id = 'erroValidacao';
    notificacao.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #ff4444, #cc0000);
      color: white;
      padding: 20px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      max-width: 90vw;
      text-align: center;
      white-space: pre-line;
      animation: slideIn 0.3s ease-out;
    `;
    
    notificacao.innerHTML = `
      <div style="margin-bottom: 15px; font-size: 1.2rem;">⚠️ Validação Necessária</div>
      <div style="margin-bottom: 20px;">${mensagem}</div>
      <button onclick="this.parentElement.remove()" style="
        background: white;
        color: #cc0000;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      ">Entendi</button>
    `;
    
    // Adicionar CSS para animação
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translate(-50%, -60%);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }
    `;
    document.head.appendChild(style);
    
    // Remover notificação anterior se existir
    const notificacaoAnterior = document.getElementById('erroValidacao');
    if (notificacaoAnterior) {
      notificacaoAnterior.remove();
    }
    
    document.body.appendChild(notificacao);
    
    // Remover automaticamente após 8 segundos
    setTimeout(() => {
      if (notificacao.parentElement) {
        notificacao.remove();
      }
    }, 8000);
  }
  
  // Enviar pedido para WhatsApp
  function enviarPedidoWhatsApp() {
    console.log('🔄 Iniciando envio do pedido...');
    console.log('📅 Agendamento:', state.agendamento);
    console.log('🛒 Carrinho:', state.cart);
    
    // Validações usando a nova função
    const validacao = validarPagamento();
    if (!validacao.valido) {
      mostrarErroValidacao(validacao.erros);
      return;
    }
    
    // Validação adicional para dados do cliente
    if (!state.client || !state.client.name || !state.client.phone) {
      toast('Erro: Dados do cliente não encontrados');
      return;
    }
    
    // Número do WhatsApp do Estúdio 23
    const numeroWhatsApp = '5535998538585';
    
    // Verificar se há assinatura no carrinho
    const subscriptionItem = state.cart.find(item => item.tipo === 'subscription');
    if (subscriptionItem) {
      activateSubscription(subscriptionItem.id);
    }
    
    // Calcular total
    const total = calculateTotal();
    const buscaLeva = state.buscaLeva ? 4.99 : 0;
    const totalFinal = total + buscaLeva;
    
    // Criar objeto do agendamento para salvar no sistema
    const agendamentoData = {
      id: Date.now().toString(),
      cliente: {
        nome: state.client.name,
        telefone: state.client.phone
      },
      data: state.agendamento.data,
      horario: state.agendamento.horario,
      servicos: state.cart.map(item => ({
        nome: item.nome,
        preco: item.preco,
        pontos: item.pontos || 0,
        tipo: item.tipo || 'servico'
      })),
      total: totalFinal,
      buscaLeva: state.buscaLeva,
      status: 'pending', // pending, confirmed, completed
      dataCriacao: new Date().toISOString(),
      pontosPendentes: state.cart.reduce((total, item) => total + (item.pontos || 0), 0)
    };
    
    // Salvar agendamento no sistema admin
    saveAgendamento(agendamentoData);
    
    // AGORA SIM: Bloquear horários após confirmação de pagamento
    const agendamentosGlobais = JSON.parse(localStorage.getItem('agendamentosGlobais') || '[]');
    
    // Determinar quantos horários bloquear baseado no tipo de serviço
    let horariosParaBloquear = 1; // Por padrão, bloquear apenas 1 hora
    
    // Verificar se há serviços que precisam de 2 horas
    const servicosComDuasHoras = ['lavagem_simples', 'lavagem_detalhada'];
    const temServicoComDuasHoras = state.cart.some(item => 
      servicosComDuasHoras.includes(item.id)
    );
    
    if (temServicoComDuasHoras) {
      horariosParaBloquear = 2; // Bloquear 2 horas para limpeza simples/detalhada
    }
    
    // Adicionar agendamentos para os horários necessários
    const horaInicial = parseInt(state.agendamento.horario.split(':')[0]);
    for (let i = 0; i < horariosParaBloquear; i++) {
      const horaAtual = horaInicial + i;
      const horarioString = `${horaAtual.toString().padStart(2, '0')}:00`;
      
      // Verificar se não está duplicado e se está dentro do horário de funcionamento
      const jaExiste = agendamentosGlobais.some(ag => 
        ag.data === state.agendamento.data && ag.horario === horarioString
      );
      if (!jaExiste && horaAtual <= 17) {
        agendamentosGlobais.push({
          data: state.agendamento.data,
          horario: horarioString,
          cliente: state.client ? state.client.name : 'Cliente',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    localStorage.setItem('agendamentosGlobais', JSON.stringify(agendamentosGlobais));
    console.log('🔒 Horários bloqueados após pagamento confirmado:', horariosParaBloquear);
    
    // Parar temporizador de reserva (pagamento confirmado)
    pararTemporizadorReserva();
    
    // Construir mensagem do WhatsApp
    let mensagem = `*NOVO PEDIDO - ESTÚDIO 23* 🚗\n\n`;
    mensagem += `*Cliente:* ${state.client.name}\n`;
    mensagem += `*WhatsApp:* ${state.client.phone}\n`;
    mensagem += `*Data:* ${new Date(state.agendamento.data).toLocaleDateString('pt-BR')}\n`;
    mensagem += `*Horário:* ${state.agendamento.horario}\n\n`;
    
    if (state.buscaLeva) {
      mensagem += `*Serviço:* Busca e Leva 🚚 (+R$ 4,99)\n`;
    }
    
    mensagem += `*Serviços:*\n`;
    state.cart.forEach(item => {
      if (item.tipo === 'subscription') {
        mensagem += `• ${item.nome} - Assinatura ${item.planDetails.benefits.lavagemSimples} lavagens + ${item.planDetails.benefits.desconto}% OFF\n`;
      } else {
        mensagem += `• ${item.nome} - R$ ${money(item.preco)} ${item.benefitText || ''}\n`;
      }
    });
    
    mensagem += `\n*Subtotal:* R$ ${money(total)}`;
    if (state.buscaLeva) {
      mensagem += `\n*Busca e Leva:* R$ 4,99`;
    }
    mensagem += `\n*Total:* R$ ${money(totalFinal)}`;
    mensagem += `\n\n*Pontos:* ${state.points} pts`;
    mensagem += `\n\n*Status:* ✅ PAGAMENTO CONFIRMADO`;
    
    console.log('📱 Mensagem construída:', mensagem);
    
    // Codificar mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem);
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;
    
    console.log('🔗 URL WhatsApp:', urlWhatsApp);
    
    // Abrir WhatsApp
    window.open(urlWhatsApp, '_blank');
    
    // Mostrar aviso sobre comprovante
    const avisoModal = document.createElement('div');
    avisoModal.className = 'screen';
    avisoModal.style.background = 'rgba(0,0,0,0.9)';
    avisoModal.innerHTML = `
      <div style="background: var(--card); padding: 32px; border-radius: 16px; text-align: center; max-width: 400px; border: 2px solid var(--brand);">
        <h3 style="color: #fff; margin: 0 0 16px 0;">📱 Pedido Enviado!</h3>
        <p style="color: #ccc; margin: 0 0 24px 0; line-height: 1.5;">
          Seu pedido foi enviado para o WhatsApp.<br>
          <strong>Não esqueça de enviar o comprovante de pagamento!</strong>
        </p>
        <button onclick="this.parentElement.parentElement.remove()" style="background: var(--brand); border: none; padding: 12px 24px; border-radius: 8px; color: #000; font-weight: 600; cursor: pointer;">
          Entendi
        </button>
      </div>
    `;
    document.body.appendChild(avisoModal);
    
    // Remover modal automaticamente após 5 segundos
    setTimeout(() => {
      if (avisoModal.parentElement) {
        avisoModal.remove();
      }
    }, 5000);
    
    // Limpar carrinho e agendamento
    state.cart = [];
    state.agendamento = null;
    state.buscaLeva = false;
    
    // Atualizar interface
    renderCart();
    document.getElementById('agendamentoEscolhido').innerHTML = '';
    
    // Salvar dados
    autoSave();
    
    toast('✅ Pedido enviado para WhatsApp com sucesso!');
    
    // Voltar para seção de serviços
    setTimeout(() => {
      scrollToSection('sec-services');
    }, 2000);
  }
  

  
  // Verificar se é admin (você pode mudar esta lógica)
  function checkAdminAccess() {
    // Opção 1: Chave secreta no localStorage (mais simples)
    const adminKey = localStorage.getItem('admin_key');
    if (adminKey === ADMIN_ACCESS_KEY) {
      return true;
    }
    
    // Opção 2: Nome e telefone específicos (mais seguro)
    if (state.client) {
      // Verificação para Erik da Cunha Oliveira
      const isErik = state.client.name.toLowerCase().includes('erik') && 
                     state.client.name.toLowerCase().includes('cunha') && 
                     state.client.name.toLowerCase().includes('oliveira');
      
      const isPhoneCorrect = state.client.phone === '35998538585';
      
      if (isErik && isPhoneCorrect) {
        localStorage.setItem('admin_key', ADMIN_ACCESS_KEY);
        return true;
      }
    }
    
    return false;
  }
  
  // Mostrar/ocultar botão admin
  function toggleAdminButton() {
    const adminBtn = document.getElementById('btnAdmin');
    if (!adminBtn) return;
    
    const hasAccess = checkAdminAccess();
    
    if (hasAccess) {
      adminBtn.classList.remove('hidden');
    } else {
      adminBtn.classList.add('hidden');
    }
  }
  
  // Abrir painel administrativo
  function openAdminPanel() {
    if (!checkAdminAccess()) {
      toast('Acesso negado');
      return;
    }
    
    document.getElementById('adminModal').classList.remove('hidden');
    loadAdminData();
  }
  
  // Fechar painel administrativo
  function closeAdminPanel() {
    document.getElementById('adminModal').classList.add('hidden');
  }
  
  // Alternar entre abas do painel
  function showAdminTab(tabName) {
    // Ocultar todas as abas
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
    event.target.classList.add('active');
    
    // Carregar dados específicos da aba
    if (tabName === 'dashboard') {
      loadDashboardData();
    } else if (tabName === 'agendamentos') {
      renderAgendamentos();
      renderAdminCalendar();
    } else if (tabName === 'clients') {
      loadClientsData();
    } else if (tabName === 'services') {
      loadServicesData();
    } else if (tabName === 'finance') {
      loadFinanceData();
    }
  }
  
  // Carregar dados gerais do painel
  function loadAdminData() {
    loadDashboardData();
    renderAgendamentos();
    renderAdminCalendar();
    loadClientsData();
    loadServicesData();
    loadFinanceData();
  }
  
  // Carregar dados do dashboard
  function loadDashboardData() {
    // Total de clientes
    const clients = getAllClients();
    document.getElementById('totalClients').textContent = clients.length;
    
    // Receita total
    const totalRevenue = calculateTotalRevenue();
    document.getElementById('totalRevenue').textContent = money(totalRevenue);
    
    // Total de serviços
    const totalServices = calculateTotalServices();
    document.getElementById('totalServices').textContent = totalServices;
    
    // Assinaturas ativas
    const activeSubscriptions = calculateActiveSubscriptions();
    document.getElementById('activeSubscriptions').textContent = activeSubscriptions;
    
    // Atividades recentes
    loadRecentActivities();
  }
  
  // Calcular receita total
  function calculateTotalRevenue() {
    const agendamentos = loadAgendamentos();
    const servicosCompletados = agendamentos.filter(ag => ag.status === 'completed');
    return servicosCompletados.reduce((total, ag) => total + ag.total, 0);
  }
  
  // Calcular total de serviços
  function calculateTotalServices() {
    const agendamentos = loadAgendamentos();
    const servicosCompletados = agendamentos.filter(ag => ag.status === 'completed');
    return servicosCompletados.reduce((total, ag) => total + ag.servicos.length, 0);
  }
  
  // Calcular assinaturas ativas
  function calculateActiveSubscriptions() {
    const clients = getAllClients();
    let activeCount = 0;
    
    clients.forEach(client => {
      if (client.subscription && client.subscription.active) {
        const subscriptionEnd = new Date(client.subscription.endDate);
        if (subscriptionEnd > new Date()) {
          activeCount++;
        }
      }
    });
    
    return activeCount;
  }
  
  // Carregar atividades recentes
  function loadRecentActivities() {
    const agendamentos = loadAgendamentos();
    const recentActivities = document.getElementById('recentActivities');
    
    if (!recentActivities) return;
    
    // Pegar os 5 agendamentos mais recentes
    const recentes = agendamentos
      .sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao))
      .slice(0, 5);
    
    if (recentes.length === 0) {
      recentActivities.innerHTML = '<div class="muted">Nenhuma atividade recente</div>';
      return;
    }
    
    recentActivities.innerHTML = recentes.map(ag => {
      const dataFormatada = new Date(ag.dataCriacao).toLocaleDateString('pt-BR');
      const statusText = {
        'pending': 'Pendente',
        'confirmed': 'Confirmado',
        'completed': 'Concluído'
      };
      
      return `
        <div class="activity-item">
          <div class="activity-header">
            <span class="activity-client">${ag.cliente.nome}</span>
            <span class="activity-status status-${ag.status}">${statusText[ag.status]}</span>
          </div>
          <div class="activity-details">
            ${new Date(ag.data).toLocaleDateString('pt-BR')} às ${ag.horario} - R$ ${money(ag.total)}
          </div>
          <div class="activity-time">${dataFormatada}</div>
        </div>
      `;
    }).join('');
  }
  
  // Carregar dados dos clientes
  function loadClientsData() {
    const clientsTable = document.getElementById('clientsTable');
    clientsTable.innerHTML = '';
    
    // Cabeçalho da tabela
    const headerRow = document.createElement('div');
    headerRow.className = 'client-row header';
    headerRow.innerHTML = `
      <div>Nome</div>
      <div>WhatsApp</div>
      <div>Último Serviço</div>
      <div>Total Gasto</div>
      <div>Status</div>
    `;
    clientsTable.appendChild(headerRow);
    
    // Buscar todos os clientes
    const clients = getAllClients();
    
    clients.forEach(client => {
      const clientRow = document.createElement('div');
      clientRow.className = 'client-row';
      
      const lastService = getLastServiceDate(client.phone);
      const totalSpent = calculateClientTotal(client.phone);
      const isActive = isClientActive(client.phone);
      
      clientRow.innerHTML = `
        <div class="client-name" data-label="Nome">${client.name}</div>
        <div class="client-phone" data-label="WhatsApp">${maskPhone(client.phone)}</div>
        <div class="client-last-service" data-label="Último Serviço">${lastService}</div>
        <div class="client-total" data-label="Total Gasto">R$ ${money(totalSpent)}</div>
        <div class="client-status ${isActive ? 'status-active' : 'status-inactive'}" data-label="Status">
          ${isActive ? 'Ativo' : 'Inativo'}
        </div>
      `;
      clientsTable.appendChild(clientRow);
    });
  }
  
  // Buscar clientes
  function searchClients() {
    const searchTerm = document.getElementById('clientSearch').value.toLowerCase();
    const clientRows = document.querySelectorAll('.client-row:not(.header)');
    
    clientRows.forEach(row => {
      const clientName = row.querySelector('.client-name').textContent.toLowerCase();
      const clientPhone = row.querySelector('.client-phone').textContent.toLowerCase();
      
      if (clientName.includes(searchTerm) || clientPhone.includes(searchTerm)) {
        row.style.display = 'grid';
      } else {
        row.style.display = 'none';
      }
    });
  }
  
  // Carregar dados dos serviços
  function loadServicesData() {
    const servicesStats = document.getElementById('servicesStats');
    servicesStats.innerHTML = '';
    
    const serviceStats = calculateServiceStats();
    
    Object.keys(serviceStats).forEach(serviceName => {
      const stats = serviceStats[serviceName];
      const service = SERVICES.find(s => s.nome === serviceName);
      
      if (stats.count > 0) {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-stat-card';
        
        const maxRevenue = Math.max(...Object.values(serviceStats).map(s => s.revenue));
        const progressWidth = (stats.revenue / maxRevenue) * 100;
        
        serviceCard.innerHTML = `
          <div class="service-stat-header">
            <div class="service-stat-name">${service ? service.nome : serviceName}</div>
            <div class="service-stat-count">${stats.count}</div>
          </div>
          <div class="service-stat-revenue">R$ ${money(stats.revenue)}</div>
          <div class="service-stat-bar">
            <div class="service-stat-progress" style="width: ${progressWidth}%"></div>
          </div>
        `;
        servicesStats.appendChild(serviceCard);
      }
    });
  }
  
  // Carregar dados financeiros
  function loadFinanceData() {
    // Receita mensal
    const monthlyRevenue = calculateMonthlyRevenue();
    document.getElementById('monthlyRevenue').textContent = money(monthlyRevenue);
    
    // Receita anual
    const yearlyRevenue = calculateYearlyRevenue();
    document.getElementById('yearlyRevenue').textContent = money(yearlyRevenue);
    
    // Média por cliente
    const avgPerClient = calculateAveragePerClient();
    document.getElementById('avgPerClient').textContent = money(avgPerClient);
    
    // Gráfico simples
    loadRevenueChart();
  }
  
  function calculateMonthlyRevenue() {
    // Implementar cálculo da receita mensal
    const agendamentos = loadAgendamentos();
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    
    const agendamentosMes = agendamentos.filter(ag => {
      const dataAgendamento = new Date(ag.dataConclusao);
      return ag.status === 'completed' && 
             dataAgendamento.getMonth() === mesAtual && 
             dataAgendamento.getFullYear() === anoAtual;
    });
    
    return agendamentosMes.reduce((total, ag) => total + ag.total, 0);
  }
  
  function calculateYearlyRevenue() {
    // Implementar cálculo da receita anual
    const agendamentos = loadAgendamentos();
    const anoAtual = new Date().getFullYear();
    
    const agendamentosAno = agendamentos.filter(ag => {
      const dataAgendamento = new Date(ag.dataConclusao);
      return ag.status === 'completed' && 
             dataAgendamento.getFullYear() === anoAtual;
    });
    
    return agendamentosAno.reduce((total, ag) => total + ag.total, 0);
  }
  
  function calculateAveragePerClient() {
    // Implementar cálculo da média por cliente
    const agendamentos = loadAgendamentos();
    const servicosCompletados = agendamentos.filter(ag => ag.status === 'completed');
    
    if (servicosCompletados.length === 0) return 0;
    
    const totalReceita = servicosCompletados.reduce((total, ag) => total + ag.total, 0);
    const clientesUnicos = new Set(servicosCompletados.map(ag => ag.cliente.telefone));
    
    return totalReceita / clientesUnicos.size;
  }
  
  function loadRevenueChart() {
    // Implementar gráfico de receita
    const chartContainer = document.getElementById('revenueChart');
    chartContainer.innerHTML = '<div style="color: #666;">Gráfico de receita será implementado</div>';
  }
  
  /* ================ FUNÇÃO DE LOGOUT ================= */
  
  // Função para fazer logout
  function logout() {
    
    // Limpar apenas os dados da sessão atual
    state.client = null;
    state.cart = [];
    state.agendamento = null;
    state.buscaLeva = false;
    
    // Limpar apenas o CID da sessão atual (não afeta outros dados)
    localStorage.removeItem('cid');
    
    // Mostrar tela de login novamente
    const loginScreen = document.getElementById('signup');
    if (loginScreen) {
      loginScreen.classList.remove('hidden');
    }
    
    // Resetar interface
    renderClientChip();
    renderServices();
    renderCart();
    renderPoints();
    renderHistory();
    renderRewards();
    renderSubscriptionStatus();
    
    // Ocultar botão admin
    const adminBtn = document.getElementById('btnAdmin');
    if (adminBtn) {
      adminBtn.classList.add('hidden');
    }
    
    // Mensagem de confirmação
    toast('Logout realizado com sucesso!');
    
    // Scroll para o topo
    window.scrollTo(0, 0);
    
  }
  
  /* ================ FUNÇÕES DE PERSISTÊNCIA ================= */
  
  // Buscar todos os clientes salvos
  function getAllClients() {
    try {
      const clients = localStorage.getItem('clients');
      return clients ? JSON.parse(clients) : [];
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      return [];
    }
  }
  
  // Obter data do último serviço de um cliente
  function getLastServiceDate(phone) {
    const agendamentos = loadAgendamentos();
    const clienteAgendamentos = agendamentos
      .filter(ag => ag.cliente.telefone === phone && ag.status === 'completed')
      .sort((a, b) => new Date(b.dataConclusao) - new Date(a.dataConclusao));
    
    if (clienteAgendamentos.length > 0) {
      return new Date(clienteAgendamentos[0].dataConclusao).toLocaleDateString('pt-BR');
    }
    
    return 'Nunca';
  }
  
  // Calcular total gasto por um cliente
  function calculateClientTotal(phone) {
    const agendamentos = loadAgendamentos();
    const clienteAgendamentos = agendamentos.filter(ag => 
      ag.cliente.telefone === phone && ag.status === 'completed'
    );
    
    return clienteAgendamentos.reduce((total, ag) => total + ag.total, 0);
  }
  
  // Verificar se um cliente está ativo (serviço nos últimos 90 dias)
  function isClientActive(phone) {
    const agendamentos = loadAgendamentos();
    const clienteAgendamentos = agendamentos.filter(ag => 
      ag.cliente.telefone === phone && ag.status === 'completed'
    );
    
    if (clienteAgendamentos.length === 0) return false;
    
    // Verificar se teve serviço nos últimos 90 dias
    const ultimoServico = clienteAgendamentos
      .sort((a, b) => new Date(b.dataConclusao) - new Date(a.dataConclusao))[0];
    
    const dataUltimoServico = new Date(ultimoServico.dataConclusao);
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 90);
    
    return dataUltimoServico >= dataLimite;
  }
  
  // Calcular estatísticas dos serviços
  function calculateServiceStats() {
    const agendamentos = loadAgendamentos();
    const servicosCompletados = agendamentos.filter(ag => ag.status === 'completed');
    
    const stats = {};
    
    servicosCompletados.forEach(agendamento => {
      agendamento.servicos.forEach(servico => {
        const serviceName = servico.nome;
        if (!stats[serviceName]) {
          stats[serviceName] = {
            count: 0,
            revenue: 0
          };
        }
        
        stats[serviceName].count++;
        stats[serviceName].revenue += servico.preco;
      });
    });
    
    return stats;
  }
  
  // Salvar dados do cliente atual
  function saveClientData() {
    if (!state.client || !state.client.cid) {
      console.log('❌ Cliente ou CID não encontrado para salvar dados');
      return;
    }
    
    const cid = state.client.cid;
    console.log('💾 Salvando dados do cliente:', cid);
    
    try {
      // Salvar dados principais
      localStorage.setItem(`points_${cid}`, state.points.toString());
      localStorage.setItem(`cart_${cid}`, JSON.stringify(state.cart));
      localStorage.setItem(`agendamento_${cid}`, JSON.stringify(state.agendamento));
      localStorage.setItem(`buscaLeva_${cid}`, JSON.stringify(state.buscaLeva));
      localStorage.setItem(`subscription_${cid}`, JSON.stringify(state.subscription));
      localStorage.setItem(`history_${cid}`, JSON.stringify(state.history));
      
      // Salvar cliente na lista de clientes
      const clients = getAllClients();
      const existingClientIndex = clients.findIndex(c => c.phone === state.client.phone);
      
      if (existingClientIndex !== -1) {
        // Atualizar cliente existente
        clients[existingClientIndex] = {
          ...clients[existingClientIndex],
          name: state.client.name,
          phone: state.client.phone,
          points: state.points,
          lastService: new Date().toISOString(),
          subscription: state.subscription
        };
      } else {
        // Adicionar novo cliente
        clients.push({
          name: state.client.name,
          phone: state.client.phone,
          points: state.points,
          lastService: new Date().toISOString(),
          subscription: state.subscription
        });
      }
      
      localStorage.setItem('clients', JSON.stringify(clients));
      
      console.log('✅ Dados salvos com sucesso!');
      console.log('📊 Resumo dos dados salvos:');
      console.log('   - Pontos:', state.points);
      console.log('   - Carrinho:', state.cart.length, 'itens');
      console.log('   - Agendamento:', state.agendamento ? 'Sim' : 'Não');
      console.log('   - Busca e Leva:', state.buscaLeva);
      console.log('   - Assinatura:', state.subscription ? 'Sim' : 'Não');
      console.log('   - Histórico:', state.history.length, 'itens');
      
    } catch (error) {
      console.error('❌ Erro ao salvar dados do cliente:', error);
    }
  }
  
  // Carregar dados do cliente atual
  function loadClientData() {
    if (!state.client || !state.client.cid) {
      console.log('❌ Cliente ou CID não encontrado para carregar dados');
      return;
    }
    
    const cid = state.client.cid;
    console.log('📱 Carregando dados do cliente:', cid);
    
    try {
      // Carregar pontos
      const savedPoints = localStorage.getItem(`points_${cid}`);
      if (savedPoints) {
        state.points = parseInt(savedPoints);
        console.log('✅ Pontos carregados:', state.points);
      } else {
        state.points = 0;
        console.log('📝 Pontos inicializados como 0');
      }
      
      // Carregar carrinho
      const savedCart = localStorage.getItem(`cart_${cid}`);
      if (savedCart) {
        state.cart = JSON.parse(savedCart);
        console.log('✅ Carrinho carregado:', state.cart.length, 'itens');
      } else {
        state.cart = [];
        console.log('📝 Carrinho inicializado como vazio');
      }
      
      // Carregar agendamento
      const savedAgendamento = localStorage.getItem(`agendamento_${cid}`);
      if (savedAgendamento && savedAgendamento !== 'null') {
        state.agendamento = JSON.parse(savedAgendamento);
        console.log('✅ Agendamento carregado:', state.agendamento);
      } else {
        state.agendamento = null;
        console.log('📝 Agendamento inicializado como null');
      }
      
      // Carregar busca e leva
      const savedBuscaLeva = localStorage.getItem(`buscaLeva_${cid}`);
      if (savedBuscaLeva) {
        state.buscaLeva = JSON.parse(savedBuscaLeva);
        console.log('✅ Busca e leva carregado:', state.buscaLeva);
      } else {
        state.buscaLeva = false;
        console.log('📝 Busca e leva inicializado como false');
      }
      
      // Carregar assinatura
      const savedSubscription = localStorage.getItem(`subscription_${cid}`);
      if (savedSubscription && savedSubscription !== 'null') {
        state.subscription = JSON.parse(savedSubscription);
        console.log('✅ Assinatura carregada:', state.subscription);
      } else {
        state.subscription = null;
        console.log('📝 Assinatura inicializada como null');
      }
      
      // Carregar histórico
      const savedHistory = localStorage.getItem(`history_${cid}`);
      if (savedHistory) {
        state.history = JSON.parse(savedHistory);
        console.log('✅ Histórico carregado:', state.history.length, 'itens');
      } else {
        state.history = [];
        console.log('📝 Histórico inicializado como vazio');
      }
      
      console.log('✅ Todos os dados do cliente carregados com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do cliente:', error);
      // Em caso de erro, inicializar com valores padrão
      state.points = 0;
      state.cart = [];
      state.agendamento = null;
      state.buscaLeva = false;
      state.subscription = null;
      state.history = [];
    }
  }
  
  // Salvar dados automaticamente quando houver mudanças
  function autoSave() {
    saveClientData();
  }
  
  // Função para renderizar status do agendamento
  function renderAgendamentoStatus() {
    const agendamentoDiv = document.getElementById('agendamentoEscolhido');
    const btnOpenAgenda = document.getElementById('btnOpenAgendaModal');
    
    if (!agendamentoDiv || !btnOpenAgenda) return;
    
    if (state.agendamento && state.agendamento.data && state.agendamento.horario) {
      // Agendamento selecionado
      agendamentoDiv.innerHTML = `
        <div style="background: rgba(40, 167, 69, 0.1); padding: 12px; border-radius: 8px; border: 1px solid #28a745;">
          <strong style="color: #28a745;">✓ Agendado para:</strong><br>
          ${new Date(state.agendamento.data).toLocaleDateString('pt-BR')} às ${state.agendamento.horario}
        </div>
      `;
      btnOpenAgenda.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
      btnOpenAgenda.textContent = 'Alterar agendamento';
    } else {
      // Nenhum agendamento selecionado
      agendamentoDiv.innerHTML = `
        <div style="background: rgba(255, 127, 0, 0.1); padding: 12px; border-radius: 8px; border: 1px solid #ff7f00;">
          <strong style="color: #ff7f00;">⚠️ Nenhum agendamento selecionado</strong><br>
          <span style="color: #ff7f00; font-size: 0.9rem;">Selecione uma data e horário para continuar</span>
        </div>
      `;
      btnOpenAgenda.style.background = 'linear-gradient(135deg, #ff7f00, #ff9500)';
      btnOpenAgenda.textContent = 'Escolher dia e horário';
    }
  }
  
  // Função para limpar agendamento temporário
  function limparAgendamentoTemporario() {
    if (state.agendamento && (!state.cart || state.cart.length === 0)) {
      console.log('🧹 Limpando agendamento temporário - carrinho vazio');
      state.agendamento = null;
      set('agendamento', null);
      renderAgendamentoStatus();
      
      // Parar temporizador se estiver rodando
      pararTemporizadorReserva();
    }
  }
  
  // Função para iniciar temporizador de reserva
  function iniciarTemporizadorReserva() {
    // Limpar temporizador anterior se existir
    if (window.reservaTimer) {
      clearInterval(window.reservaTimer);
      clearTimeout(window.reservaTimeout);
    }
    
    // Criar elemento do temporizador
    let temporizadorDiv = document.getElementById('temporizadorReserva');
    if (!temporizadorDiv) {
      temporizadorDiv = document.createElement('div');
      temporizadorDiv.id = 'temporizadorReserva';
      temporizadorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #ff7f00, #ff9500);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 1rem;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(255,127,0,0.4);
        text-align: center;
        animation: slideDown 0.3s ease-out;
      `;
      document.body.appendChild(temporizadorDiv);
    }
    
    let minutosRestantes = 5;
    let segundosRestantes = 0;
    
    const atualizarTemporizador = () => {
      if (segundosRestantes > 0) {
        segundosRestantes--;
      } else {
        if (minutosRestantes > 0) {
          minutosRestantes--;
          segundosRestantes = 59;
        } else {
          // Tempo esgotado - liberar reserva
          clearInterval(window.reservaTimer);
          clearTimeout(window.reservaTimeout);
          
          // Limpar agendamento temporário
          state.agendamento = null;
          set('agendamento', null);
          
          // Remover temporizador
          if (temporizadorDiv.parentElement) {
            temporizadorDiv.remove();
          }
          
          // Atualizar interface
          renderAgendamentoStatus();
          
          // Mostrar aviso
          toast('⏰ Tempo esgotado! Reserva liberada. Selecione um novo horário.');
          console.log('⏰ Reserva temporária expirada - horário liberado');
          
          return;
        }
      }
      
      // Atualizar display
      const tempoFormatado = `${minutosRestantes}:${segundosRestantes.toString().padStart(2, '0')}`;
      temporizadorDiv.innerHTML = `
        <div style="margin-bottom: 8px;">⏰ RESERVA TEMPORÁRIA</div>
        <div style="font-size: 1.2rem; font-weight: 700;">${tempoFormatado}</div>
        <div style="font-size: 0.9rem; margin-top: 8px;">Complete o pagamento para confirmar</div>
      `;
    };
    
    // Iniciar contagem regressiva
    atualizarTemporizador();
    window.reservaTimer = setInterval(atualizarTemporizador, 1000);
    
    // Adicionar CSS para animação
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    
    console.log('⏰ Temporizador de reserva iniciado - 5 minutos');
  }
  
  // Função para zerar todos os horários agendados
  function zerarTodosHorarios() {
    if (confirm('⚠️ ATENÇÃO: Isso irá remover TODOS os horários agendados do sistema!\n\nTem certeza que deseja continuar?')) {
      // Limpar agendamentos globais
      localStorage.removeItem('agendamentosGlobais');
      
      // Limpar agendamentos do admin
      localStorage.removeItem('admin_agendamentos');
      
      // Limpar agendamentos temporários de todos os clientes
      const clients = getAllClients();
      clients.forEach(client => {
        const cid = `client_${client.phone}`;
        try {
          const clientData = JSON.parse(localStorage.getItem(cid) || '{}');
          if (clientData.agendamento) {
            delete clientData.agendamento;
            localStorage.setItem(cid, JSON.stringify(clientData));
          }
        } catch (e) {
          console.log('Erro ao limpar agendamento do cliente:', client.phone);
        }
      });
      
      // Limpar agendamento atual se existir
      if (state.agendamento) {
        state.agendamento = null;
        set('agendamento', null);
        renderAgendamentoStatus();
      }
      
      // Parar temporizador se estiver rodando
      pararTemporizadorReserva();
      
      // Atualizar interface admin se estiver aberta
      if (document.getElementById('adminCalendar')) {
        renderAdminCalendar();
      }
      
      toast('✅ Todos os horários foram zerados com sucesso!');
      console.log('🧹 Todos os horários agendados foram zerados');
    }
  }
  
  // Função para parar temporizador de reserva (quando pagamento for confirmado)
  function pararTemporizadorReserva() {
    if (window.reservaTimer) {
      clearInterval(window.reservaTimer);
      clearTimeout(window.reservaTimeout);
      window.reservaTimer = null;
      
      // Remover temporizador da tela
      const temporizadorDiv = document.getElementById('temporizadorReserva');
      if (temporizadorDiv && temporizadorDiv.parentElement) {
        temporizadorDiv.remove();
      }
      
      console.log('✅ Temporizador de reserva parado - pagamento confirmado');
    }
  }
  
  // Função para verificar status do login
  function checkLoginStatus() {
    const savedCid = localStorage.getItem('cid');
    const loginScreen = document.getElementById('signup');
    
    if (savedCid && state.client) {
      console.log('✅ Cliente logado:', state.client.name);
      
      // Adicionar indicador visual de login ativo
      const loginIndicator = document.createElement('div');
      loginIndicator.id = 'loginIndicator';
      loginIndicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, #4caf50, #45a049);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 6px;
      `;
      loginIndicator.innerHTML = `
        <span>🟢</span>
        <span>Logado como ${state.client.name}</span>
      `;
      
      // Remover indicador anterior se existir
      const existingIndicator = document.getElementById('loginIndicator');
      if (existingIndicator) {
        existingIndicator.remove();
      }
      
      document.body.appendChild(loginIndicator);
      
      // Remover indicador após 3 segundos
      setTimeout(() => {
        if (loginIndicator.parentElement) {
          loginIndicator.style.opacity = '0';
          loginIndicator.style.transform = 'translateY(-10px)';
          setTimeout(() => {
            if (loginIndicator.parentElement) {
              loginIndicator.remove();
            }
          }, 300);
        }
      }, 3000);
      
    } else {
      console.log('❌ Cliente não logado');
      
      // Remover indicador se existir
      const existingIndicator = document.getElementById('loginIndicator');
      if (existingIndicator) {
        existingIndicator.remove();
      }
    }
  }
  
  /* ================ GERENCIAMENTO DE AGENDAMENTOS ================= */
  
  // Salvar agendamento no sistema
  function saveAgendamento(agendamentoData) {
    let agendamentos = JSON.parse(localStorage.getItem('admin_agendamentos') || '[]');
    agendamentos.push(agendamentoData);
    localStorage.setItem('admin_agendamentos', JSON.stringify(agendamentos));
    console.log('✅ Agendamento salvo:', agendamentoData);
  }
  
  // Carregar agendamentos do sistema
  function loadAgendamentos() {
    return JSON.parse(localStorage.getItem('admin_agendamentos') || '[]');
  }
  
  // Renderizar calendário visual para admin
  function renderAdminCalendar() {
    const calendarContainer = document.getElementById('adminCalendar');
    if (!calendarContainer) return;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Nomes dos meses
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    // Nomes dos dias da semana
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Primeiro dia do mês
    const firstDay = new Date(currentYear, currentMonth, 1);
    // Último dia do mês
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Dia da semana do primeiro dia (0 = Domingo, 1 = Segunda, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Número total de dias no mês
    const totalDays = lastDay.getDate();
    
    // Buscar agendamentos para este mês
    const agendamentosGlobais = JSON.parse(localStorage.getItem('agendamentosGlobais') || '[]');
    
    let calendarHTML = `
      <div class="admin-calendar-header">
        <h3>${monthNames[currentMonth]} ${currentYear}</h3>
        <div class="admin-calendar-legend">
          <div class="legend-item">
            <span class="legend-color available"></span>
            <span>Livre</span>
          </div>
          <div class="legend-item">
            <span class="legend-color occupied"></span>
            <span>Ocupado</span>
          </div>
          <div class="legend-item">
            <span class="legend-color weekend"></span>
            <span>Fim de Semana</span>
          </div>
        </div>
      </div>
      <div class="admin-calendar-days">
        ${dayNames.map(day => `<div class="admin-day-name">${day}</div>`).join('')}
    `;
    
    // Adicionar espaços vazios para alinhar com os dias da semana
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarHTML += '<div class="admin-day empty"></div>';
    }
    
    // Adicionar os dias do mês
    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(currentYear, currentMonth, day);
      const dayOfWeek = currentDate.getDay();
      const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      const isPast = currentDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Domingo ou Sábado
      const isAvailable = !isPast && !isWeekend && dayOfWeek >= 1 && dayOfWeek <= 5; // Segunda a Sexta
      
      // Verificar se há agendamentos neste dia
      const dataString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const agendamentosDoDia = agendamentosGlobais.filter(ag => ag.data === dataString);
      const temAgendamentos = agendamentosDoDia.length > 0;
      
      let dayClass = 'admin-day';
      if (isToday) dayClass += ' today';
      if (isPast) dayClass += ' past';
      if (isWeekend) dayClass += ' weekend';
      if (isAvailable) dayClass += ' available';
      if (temAgendamentos) dayClass += ' occupied';
      
      let dayContent = day.toString();
      if (temAgendamentos) {
        dayContent += `<div class="admin-day-indicator">${agendamentosDoDia.length}</div>`;
      }
      
      calendarHTML += `
        <div class="${dayClass}" title="${dataString}${temAgendamentos ? ` - ${agendamentosDoDia.length} agendamento(s)` : ''}">
          ${dayContent}
        </div>
      `;
    }
    
    calendarHTML += '</div>';
    calendarContainer.innerHTML = calendarHTML;
  }
  
  // Renderizar lista de agendamentos
  function renderAgendamentos(filter = 'all') {
    const agendamentos = loadAgendamentos();
    const container = document.getElementById('agendamentosList');
    
    if (!container) return;
    
    // Filtrar agendamentos
    let filteredAgendamentos = agendamentos;
    if (filter !== 'all') {
      filteredAgendamentos = agendamentos.filter(ag => ag.status === filter);
    }
    
    // Ordenar por data de criação (mais recentes primeiro)
    filteredAgendamentos.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
    
    if (filteredAgendamentos.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--muted);">
          <div style="font-size: 3rem; margin-bottom: 16px;">📅</div>
          <h3>Nenhum agendamento encontrado</h3>
          <p>Os agendamentos aparecerão aqui quando os clientes enviarem pedidos via WhatsApp.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = filteredAgendamentos.map(agendamento => {
      const dataFormatada = new Date(agendamento.data).toLocaleDateString('pt-BR');
      const statusText = {
        'pending': 'Pendente',
        'confirmed': 'Confirmado',
        'completed': 'Concluído'
      };
      
      const servicosHTML = agendamento.servicos.map(servico => `
        <div class="servico-item">
          <span class="servico-nome">${servico.nome}</span>
          <span class="servico-pontos">${servico.pontos} pts</span>
        </div>
      `).join('');
      
      const totalServicos = agendamento.servicos.reduce((total, servico) => total + servico.preco, 0);
      
      return `
        <div class="agendamento-card">
          <div class="agendamento-header">
            <div class="agendamento-info">
              <div class="agendamento-cliente">${agendamento.cliente.nome}</div>
              <div class="agendamento-contato">${agendamento.cliente.telefone}</div>
              <div class="agendamento-data">${dataFormatada} às ${agendamento.horario}</div>
            </div>
            <div class="agendamento-status status-${agendamento.status}">
              ${statusText[agendamento.status]}
            </div>
          </div>
          
          <div class="agendamento-servicos">
            ${servicosHTML}
          </div>
          
          <div class="agendamento-total">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>R$ ${money(totalServicos)}</span>
            </div>
            ${agendamento.buscaLeva ? `
            <div class="total-row">
              <span>Busca e Leva:</span>
              <span>R$ 4,99</span>
            </div>
            ` : ''}
            <div class="total-row">
              <span>Total:</span>
              <span>R$ ${money(agendamento.total)}</span>
            </div>
            <div class="total-row">
              <span>Pontos Pendentes:</span>
              <span>${agendamento.pontosPendentes} pts</span>
            </div>
          </div>
          
          <div class="agendamento-actions">
            ${agendamento.status === 'pending' ? `
              <button class="btn-confirm" onclick="confirmarAgendamento('${agendamento.id}')">
                ✅ Confirmar e Adicionar Pontos
              </button>
            ` : ''}
            ${agendamento.status === 'confirmed' ? `
              <button class="btn-complete" onclick="completarAgendamento('${agendamento.id}')">
                🎯 Marcar como Concluído
              </button>
            ` : ''}
            ${agendamento.status === 'completed' ? `
              <div style="color: var(--brand); font-weight: 600; padding: 8px; background: rgba(255,127,0,0.1); border-radius: 6px; text-align: center;">
                ✅ Serviço Concluído
              </div>
            ` : ''}
            <button class="btn-remove" onclick="removerAgendamento('${agendamento.id}', '${agendamento.data}', '${agendamento.horario}')" style="
              background: linear-gradient(135deg, #dc3545, #c82333);
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 0.9rem;
              cursor: pointer;
              margin-top: 8px;
              width: 100%;
              transition: all 0.3s ease;
            ">
              🗑️ Remover Agendamento
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    // Atualizar estatísticas
    updateAgendamentosStats();
  }
  
  // Confirmar agendamento e adicionar pontos
  function confirmarAgendamento(agendamentoId) {
    const agendamentos = loadAgendamentos();
    const agendamento = agendamentos.find(ag => ag.id === agendamentoId);
    
    if (!agendamento) {
      toast('❌ Agendamento não encontrado');
      return;
    }
    
    // Atualizar status
    agendamento.status = 'confirmed';
    agendamento.dataConfirmacao = new Date().toISOString();
    
    // Adicionar pontos ao cliente
    const pontosParaAdicionar = agendamento.pontosPendentes;
    
    // Buscar cliente no localStorage
    const clientes = getAllClients();
    const cliente = clientes.find(c => c.phone === agendamento.cliente.telefone);
    
    if (cliente) {
      // Atualizar pontos do cliente
      cliente.points = (cliente.points || 0) + pontosParaAdicionar;
      cliente.lastService = new Date().toISOString();
      
      // Salvar cliente atualizado
      const clientesAtualizados = clientes.map(c => 
        c.phone === agendamento.cliente.telefone ? cliente : c
      );
      localStorage.setItem('clients', JSON.stringify(clientesAtualizados));
      
      // Salvar agendamento atualizado
      const agendamentosAtualizados = agendamentos.map(ag => 
        ag.id === agendamentoId ? agendamento : ag
      );
      localStorage.setItem('admin_agendamentos', JSON.stringify(agendamentosAtualizados));
      
      toast(`✅ Agendamento confirmado! ${pontosParaAdicionar} pontos adicionados ao cliente ${agendamento.cliente.nome}`);
      
      // Atualizar interface
      renderAgendamentos();
      loadAdminData(); // Recarregar dados do admin
    } else {
      toast('❌ Cliente não encontrado no sistema');
    }
  }
  
  // Remover agendamento
  function removerAgendamento(agendamentoId, data, horario) {
    if (!confirm(`Tem certeza que deseja remover o agendamento de ${data} às ${horario}?`)) {
      return;
    }
    
    // Remover do localStorage de agendamentos
    const agendamentos = JSON.parse(localStorage.getItem('admin_agendamentos') || '[]');
    const agendamentosFiltrados = agendamentos.filter(ag => ag.id !== agendamentoId);
    localStorage.setItem('admin_agendamentos', JSON.stringify(agendamentosFiltrados));
    
    // Remover dos horários globais ocupados
    const agendamentosGlobais = JSON.parse(localStorage.getItem('agendamentosGlobais') || '[]');
    const globaisFiltrados = agendamentosGlobais.filter(ag => 
      !(ag.data === data && ag.horario === horario)
    );
    localStorage.setItem('agendamentosGlobais', JSON.stringify(globaisFiltrados));
    
    // Atualizar interface
    renderAgendamentos();
    renderAdminCalendar();
    
    toast(`Agendamento removido com sucesso! Horário ${horario} do dia ${data} está livre novamente.`);
    console.log('🗑️ Agendamento removido:', agendamentoId);
  }
  
  // Completar agendamento
  function completarAgendamento(agendamentoId) {
    const agendamentos = loadAgendamentos();
    const agendamento = agendamentos.find(ag => ag.id === agendamentoId);
    
    if (!agendamento) {
      toast('❌ Agendamento não encontrado');
      return;
    }
    
    // Atualizar status
    agendamento.status = 'completed';
    agendamento.dataConclusao = new Date().toISOString();
    
    // Salvar agendamento atualizado
    const agendamentosAtualizados = agendamentos.map(ag => 
      ag.id === agendamentoId ? agendamento : ag
    );
    localStorage.setItem('admin_agendamentos', JSON.stringify(agendamentosAtualizados));
    
    toast(`🎯 Agendamento marcado como concluído!`);
    
    // Atualizar interface
    renderAgendamentos();
  }
  
  // Filtrar agendamentos
  function filterAgendamentos() {
    const filter = document.getElementById('statusFilter').value;
    renderAgendamentos(filter);
  }
  
  // Atualizar estatísticas dos agendamentos
  function updateAgendamentosStats() {
    const agendamentos = loadAgendamentos();
    
    const pendingCount = agendamentos.filter(ag => ag.status === 'pending').length;
    const confirmedCount = agendamentos.filter(ag => ag.status === 'confirmed').length;
    const completedCount = agendamentos.filter(ag => ag.status === 'completed').length;
    
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('confirmedCount').textContent = confirmedCount;
    document.getElementById('completedCount').textContent = completedCount;
  }
  