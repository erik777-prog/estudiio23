/* ================= CONFIG ================= */
const THEME = {
    POINTS_TARGET: 20000,
    REDEEM_ZERO_ALL: false
  };
  
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
    buscaLeva: get('buscaLeva') || false, // Adicionado para controlar o switch
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
  
  /* ================ BOOT (Splash -> Signup or App) ================ */
  window.addEventListener('load', ()=>{
    // splash screen
    setTimeout(()=>{
      const splash = document.getElementById('splash');
      splash.style.opacity = 0; splash.style.pointerEvents = 'none';
      setTimeout(()=>splash.style.display='none', 380);
      if(!state.client){
        $('#signup').classList.remove('hidden');
      } else {
        bootApp();
      }
      

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
    
    // Salvar dados iniciais se for novo cliente
    if (!existingCid) {
      localStorage.setItem(`points_${cid}`, '0');
      localStorage.setItem(`cart_${cid}`, '[]');
      localStorage.setItem(`agendamento_${cid}`, 'null');
      localStorage.setItem(`buscaLeva_${cid}`, 'false');
      localStorage.setItem(`subscription_${cid}`, 'null');
      localStorage.setItem(`history_${cid}`, '[]');
      localStorage.setItem(`bonus_week_${cid}`, 'false');
    }
    
    // Atualizar estado
    state.client = client;
    state.points = existingCid ? (parseInt(localStorage.getItem(`points_${cid}`)) || 0) : 0;
    state.cart = existingCid ? (JSON.parse(localStorage.getItem(`cart_${cid}`)) || []) : [];
    state.agendamento = existingCid ? (JSON.parse(localStorage.getItem(`agendamento_${cid}`)) || null) : null;
    state.buscaLeva = existingCid ? (JSON.parse(localStorage.getItem(`buscaLeva_${cid}`)) || false) : false;
    state.subscription = existingCid ? (JSON.parse(localStorage.getItem(`subscription_${cid}`)) || null) : null;
    
    // Ocultar tela de login
    $('#signup').classList.add('hidden');
    
    // Atualizar interface
    renderClientChip();
    renderServices();
    renderCart();
    renderPoints();
    renderHistory();
    renderRewards();
    renderSubscriptionStatus();
    
    // Verificar e mostrar botão admin
    toggleAdminButton();
    
    // Mensagem de boas-vindas
    toast(`Bem-vindo, ${name}!`);
  });
  
  /* ================ APP BOOT ================= */
  function bootApp(){
    // Verificar se já existe um cliente logado
    const savedCid = localStorage.getItem('cid');
    if (savedCid) {
      const savedClient = localStorage.getItem(savedCid);
      if (savedClient) {
        try {
          state.client = JSON.parse(savedClient);
          
          // Carregar outros dados salvos
          const savedPoints = localStorage.getItem(`points_${savedCid}`);
          if (savedPoints) state.points = parseInt(savedPoints);
          
          const savedCart = localStorage.getItem(`cart_${savedCid}`);
          if (savedCart) state.cart = JSON.parse(savedCart);
          
          const savedAgendamento = localStorage.getItem(`agendamento_${savedCid}`);
          if (savedAgendamento) state.agendamento = JSON.parse(savedAgendamento);
          
          const savedBuscaLeva = localStorage.getItem(`buscaLeva_${savedCid}`);
          if (savedBuscaLeva) state.buscaLeva = JSON.parse(savedBuscaLeva);
          
          const savedSubscription = localStorage.getItem(`subscription_${savedCid}`);
          if (savedSubscription) state.subscription = JSON.parse(savedSubscription);
          
          // Ocultar tela de login
          document.getElementById('signup').classList.add('hidden');
          
        } catch (error) {
          console.error('❌ Erro ao carregar dados do cliente:', error);
          // Se der erro, limpar e mostrar login
          localStorage.removeItem('cid');
          document.getElementById('signup').classList.remove('hidden');
        }
      } else {
        // CID existe mas cliente não encontrado
        localStorage.removeItem('cid');
        document.getElementById('signup').classList.remove('hidden');
      }
    } else {
      // Nenhum cliente logado, mostrar tela de login
      document.getElementById('signup').classList.remove('hidden');
    }
    
    renderClientChip();
    renderServices();
    renderCart();
    renderPoints();
    renderHistory();
    renderRewards();
    renderSubscriptionStatus();
    
    // Verificar e mostrar botão admin
    toggleAdminButton();
    
    // backtop appear
    window.addEventListener('scroll', ()=>{
      if(window.scrollY > 260) $('#btnTop').classList.remove('hidden'); else $('#btnTop').classList.add('hidden');
    });
  }
  

  
  /* ================ UI ACTIONS =================== */
  function attachUIActions(){
    $('#btnClearCart').addEventListener('click', ()=>{ state.cart=[]; set('cart', state.cart); renderCart(); });
    $('#btnShare').addEventListener('click', shareLink);
    $('#btnSaveClient').addEventListener('click', saveClient);
    $('#btnCopyLink').addEventListener('click', copyLink);
    $('#btnTop').addEventListener('click', ()=>{
      window.scrollTo({top:0,behavior:'smooth'});
    });
  
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
    $('#clientChip').textContent = state.client?.name ? `${state.client.name} · ${maskPhone(state.client.phone)}` : 'Cliente anônimo';
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
  
  /* ================ ASSINATURA ================= */
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
    
    if (!statusBadge || !statusText) return;
    
    if (!state.subscription || !state.subscription.active) {
      statusBadge.textContent = 'Sem assinatura';
      statusBadge.className = 'status-badge';
      statusText.innerHTML = `
        <div style="color: #999; text-align: center; line-height: 1.4;">
          Você ainda não possui uma assinatura ativa<br>
          <span style="color: #ff7f00; font-size: 0.9rem;">Clique em "Assinatura" para ver os planos disponíveis</span>
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
      statusText.innerHTML = `
        <div style="color: #999; text-align: center; line-height: 1.4;">
          Sua assinatura <strong>${state.subscription.planName}</strong> expirou<br>
          <span style="color: #ff7f00; font-size: 0.9rem;">Renove para continuar aproveitando os benefícios!</span>
        </div>
      `;
    } else {
      // Assinatura ativa - mostrar detalhes completos
      statusBadge.textContent = 'Ativa';
      statusBadge.className = 'status-badge active';
      
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
      buscaSwitch.innerHTML = `<span style='flex:1;text-align:left'>Busca e Leva</span><label class='busca-switch' style='margin-left:auto'><input type='checkbox' id='buscaLevaCheck' ${state.buscaLeva?'checked':''}></label>`;
      box.parentElement.insertBefore(buscaSwitch, box.parentElement.firstChild);
      document.getElementById('buscaLevaCheck').onchange = (e)=>{
        state.buscaLeva = e.target.checked;
        set('buscaLeva', state.buscaLeva);
        renderCart();
      };
    }
    let busca = state.buscaLeva ? 4.99 : 0;
    let totalFinal = total + busca;
    $('#cartTotal').textContent = money(totalFinal);
    
    // Botão de pagamento
    let payBox = document.getElementById('payBoxCustom');
    if(!payBox){
      payBox = document.createElement('div');
      payBox.id = 'payBoxCustom';
      box.parentElement.appendChild(payBox);
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
    document.getElementById('btnShowPix').onclick = () => {
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
          btnEnviar.onclick = () => {
            clearInterval(countdown5min);
            clearInterval(countdown20s);
            contadorDiv.remove();
            enviarPedidoWhatsApp();
          };
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
    
    // Salvar agendamento no estado
    state.agendamento = { data, horario };
    
    // Salvar no localStorage
    const agendamentosGlobais = JSON.parse(localStorage.getItem('agendamentosGlobais') || '[]');
    
    // Adicionar este agendamento e os próximos 3 horários (2 horas = 4 slots de 30 min)
    const [hora, minuto] = horario.split(':').map(Number);
    for (let i = 0; i < 4; i++) {
      const horarioMinutos = hora * 60 + minuto + (i * 30);
      const horaVerificar = Math.floor(horarioMinutos / 60);
      const minutoVerificar = horarioMinutos % 60;
      const horarioString = `${horaVerificar.toString().padStart(2, '0')}:${minutoVerificar.toString().padStart(2, '0')}`;
      
      // Verificar se não está duplicado
      const jaExiste = agendamentosGlobais.some(ag => ag.data === data && ag.horario === horarioString);
      if (!jaExiste) {
        agendamentosGlobais.push({
          data: data,
          horario: horarioString,
          cliente: state.client ? state.client.name : 'Cliente',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    localStorage.setItem('agendamentosGlobais', JSON.stringify(agendamentosGlobais));
    
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
    
    let calendarHTML = `
      <div class="calendar-header">
        <h3>${monthNames[currentMonth]} ${currentYear}</h3>
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
      const currentDate = new Date(currentYear, currentMonth, day);
      const dayOfWeek = currentDate.getDay();
      const isToday = day === today.getDate() && currentMonth === today.getMonth();
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
    if (firstAvailableDay <= totalDays) {
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
    const selectedDate = new Date(today.getFullYear(), today.getMonth(), day);
    
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
    
    // Horários de funcionamento: 7:30 às 18:00
    const horarios = [];
    for (let hora = 7; hora < 18; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        if (hora === 7 && minuto === 0) continue; // Pular 7:00
        if (hora === 17 && minuto === 30) continue; // Pular 17:30
        
        const horario = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        horarios.push(horario);
      }
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
      // Verificar se o horário está ocupado (incluindo 2 horas)
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
  
  // Verificar se um horário está ocupado (considerando 2 horas)
  function isHorarioOcupado(horario, horariosOcupados) {
    // Converter horário para minutos para facilitar comparação
    const [hora, minuto] = horario.split(':').map(Number);
    const horarioMinutos = hora * 60 + minuto;
    
    // Verificar se este horário ou os próximos 2 horários estão ocupados
    for (let i = 0; i < 2; i++) {
      const horarioVerificar = horarioMinutos + (i * 30);
      const horaVerificar = Math.floor(horarioVerificar / 60);
      const minutoVerificar = horarioVerificar % 60;
      const horarioString = `${horaVerificar.toString().padStart(2, '0')}:${minutoVerificar.toString().padStart(2, '0')}`;
      
      if (horariosOcupados.includes(horarioString)) {
        return true;
      }
    }
    
    return false;
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
  
  // Enviar pedido para WhatsApp
  function enviarPedidoWhatsApp() {
    if (!state.agendamento || !state.agendamento.data || !state.agendamento.horario) {
      toast('Selecione uma data e horário primeiro');
      return;
    }
    
    // ⚠️ IMPORTANTE: Mude este número antes de hospedar!
    const numeroWhatsApp = '5535998538585'; // WhatsApp do Estúdio 23
    
    // Verificar se há assinatura no carrinho
    const subscriptionItem = state.cart.find(item => item.tipo === 'subscription');
    if (subscriptionItem) {
      activateSubscription(subscriptionItem.id);
    }
    
    // Construir mensagem do WhatsApp
    let mensagem = `*NOVO PEDIDO - ESTÚDIO 23* 🚗\n\n`;
    mensagem += `*Cliente:* ${state.client.name}\n`;
    mensagem += `*WhatsApp:* ${state.client.phone}\n`;
    mensagem += `*Data:* ${new Date(state.agendamento.data).toLocaleDateString('pt-BR')}\n`;
    mensagem += `*Horário:* ${state.agendamento.horario}\n\n`;
    
    if (state.buscaLeva) {
      mensagem += `*Serviço:* Busca e Leva 🚚\n`;
    }
    
    mensagem += `*Serviços:*\n`;
    state.cart.forEach(item => {
      if (item.tipo === 'subscription') {
        mensagem += `• ${item.nome} - Assinatura ${item.planDetails.benefits.lavagemSimples} lavagens + ${item.planDetails.benefits.desconto}% OFF\n`;
      } else {
        mensagem += `• ${item.nome} - R$ ${money(item.preco)} ${item.benefitText}\n`;
      }
    });
    
    mensagem += `\n*Total:* R$ ${money(calculateTotal())}`;
    
    if (state.buscaLeva) {
      mensagem += ` (incluindo busca e leva)`;
    }
    
    mensagem += `\n\n*Pontos:* ${state.points} pts`;
    
    // Codificar mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem);
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;
    
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
    
    toast('Pedido enviado para WhatsApp com sucesso!');
  }
  
  /* ================ PAINEL ADMINISTRATIVO ================= */
  
  // Chave de acesso para o painel admin (só você saberá)
  const ADMIN_ACCESS_KEY = 'erik_cunha_estudio23_2024_admin';
  
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
    if (tabName === 'clients') {
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
    loadClientsData();
    loadServicesData();
    loadFinanceData();
  }
  
  // Carregar dados do dashboard
  function loadDashboardData() {
    // Total de clientes
    const totalClients = Object.keys(localStorage).filter(key => key.startsWith('client_')).length;
    document.getElementById('totalClients').textContent = totalClients;
    
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
    
    Object.keys(serviceStats).forEach(serviceId => {
      const stats = serviceStats[serviceId];
      const service = SERVICES.find(s => s.id === serviceId);
      
      if (service && stats.count > 0) {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-stat-card';
        
        const maxRevenue = Math.max(...Object.values(serviceStats).map(s => s.revenue));
        const progressWidth = (stats.revenue / maxRevenue) * 100;
        
        serviceCard.innerHTML = `
          <div class="service-stat-header">
            <div class="service-stat-name">${service.nome}</div>
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
  
  // Funções auxiliares para cálculos
  function calculateTotalRevenue() {
    // Implementar cálculo baseado no histórico
    return 0; // Placeholder
  }
  
  function calculateTotalServices() {
    // Implementar cálculo baseado no histórico
    return 0; // Placeholder
  }
  
  function calculateActiveSubscriptions() {
    // Implementar cálculo baseado nas assinaturas ativas
    return 0; // Placeholder
  }
  
  function loadRecentActivities() {
    // Implementar carregamento de atividades recentes
    const recentList = document.getElementById('recentActivities');
    recentList.innerHTML = '<div style="color: #666; text-align: center;">Nenhuma atividade recente</div>';
  }
  
  function getAllClients() {
    // Implementar busca de todos os clientes
    return []; // Placeholder
  }
  
  function getLastServiceDate(phone) {
    // Implementar busca da data do último serviço
    return 'N/A'; // Placeholder
  }
  
  function calculateClientTotal(phone) {
    // Implementar cálculo do total gasto pelo cliente
    return 0; // Placeholder
  }
  
  function isClientActive(phone) {
    // Implementar verificação se cliente está ativo
    return false; // Placeholder
  }
  
  function calculateServiceStats() {
    // Implementar estatísticas dos serviços
    return {}; // Placeholder
  }
  
  function calculateMonthlyRevenue() {
    // Implementar cálculo da receita mensal
    return 0; // Placeholder
  }
  
  function calculateYearlyRevenue() {
    // Implementar cálculo da receita anual
    return 0; // Placeholder
  }
  
  function calculateAveragePerClient() {
    // Implementar cálculo da média por cliente
    return 0; // Placeholder
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
  
  // Salvar dados do cliente atual
  function saveClientData() {
    if (!state.client || !state.client.cid) return;
    
    const cid = state.client.cid;
    
    // Salvar dados principais
    localStorage.setItem(`points_${cid}`, state.points.toString());
    localStorage.setItem(`cart_${cid}`, JSON.stringify(state.cart));
    localStorage.setItem(`agendamento_${cid}`, JSON.stringify(state.agendamento));
    localStorage.setItem(`buscaLeva_${cid}`, JSON.stringify(state.buscaLeva));
    localStorage.setItem(`subscription_${cid}`, JSON.stringify(state.subscription));
    
  }
  
  // Carregar dados do cliente atual
  function loadClientData() {
    if (!state.client || !state.client.cid) return;
    
    const cid = state.client.cid;
    
    // Carregar dados salvos
    const savedPoints = localStorage.getItem(`points_${cid}`);
    if (savedPoints) state.points = parseInt(savedPoints);
    
    const savedCart = localStorage.getItem(`cart_${cid}`);
    if (savedCart) state.cart = JSON.parse(savedCart);
    
    const savedAgendamento = localStorage.getItem(`agendamento_${cid}`);
    if (savedAgendamento) state.agendamento = JSON.parse(savedAgendamento);
    
    const savedBuscaLeva = localStorage.getItem(`buscaLeva_${cid}`);
    if (savedBuscaLeva) state.buscaLeva = JSON.parse(savedBuscaLeva);
    
    const savedSubscription = localStorage.getItem(`subscription_${cid}`);
    if (savedSubscription) state.subscription = JSON.parse(savedSubscription);
    
  }
  
  // Salvar dados automaticamente quando houver mudanças
  function autoSave() {
    saveClientData();
  }
  