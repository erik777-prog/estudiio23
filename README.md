# 🚗 Estúdio 23 - App de Agendamentos

Aplicativo mobile para agendamento de serviços automotivos com sistema de pontos e assinaturas.

## ✨ Funcionalidades

- 📱 **Interface Responsiva** para mobile
- 🔐 **Sistema de Login** persistente
- 📅 **Agendamentos** com calendário interativo
- 🎯 **Sistema de Pontos** e fidelidade
- 💳 **Assinaturas Mensais** com benefícios
- 📊 **Painel Administrativo** para gestão
- 💬 **Integração WhatsApp** para pedidos
- 🚚 **Serviço de Busca e Leva**

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Design**: Responsivo, Mobile-First
- **Storage**: LocalStorage para dados locais
- **Deploy**: GitHub Pages / Vercel

## 🚀 Como Usar

1. **Clone o repositório**
2. **Configure as variáveis** (veja seção de configuração)
3. **Abra index.html** no navegador
4. **Teste todas as funcionalidades**

## ⚙️ Configuração

### ✅ CONFIGURADO para o Estúdio 23!

1. **Número do WhatsApp** em `js/app.js`:
   ```javascript
   const numeroWhatsApp = '5535998538585'; // WhatsApp do Estúdio 23
   ```

2. **Chave Admin** em `js/app.js`:
   ```javascript
   const ADMIN_ACCESS_KEY = 'erik_cunha_estudio23_2024_admin';
   ```

3. **Dados do Admin** em `js/app.js`:
   ```javascript
   const isErik = state.client.name.toLowerCase().includes('erik') && 
                  state.client.name.toLowerCase().includes('cunha') && 
                  state.client.name.toLowerCase().includes('oliveira');
   
   const isPhoneCorrect = state.client.phone === '35998538585';
   ```

### 🔐 Como Acessar o Painel Admin:
- **Nome**: Erik da Cunha Oliveira
- **WhatsApp**: 35998538585
- **Chave Secreta**: erik_cunha_estudio23_2024_admin

## 📱 Funcionalidades Principais

### Para Clientes
- Cadastro e login
- Agendamento de serviços
- Sistema de pontos
- Assinaturas mensais
- Histórico de serviços

### Para Administradores
- Dashboard com estatísticas
- Gestão de clientes
- Relatórios financeiros
- Controle de agendamentos

## 🌐 Hospedagem

### GitHub Pages
- Gratuito
- Deploy automático
- URL: `username.github.io/repo-name`

### Vercel (Recomendado)
- Gratuito
- Performance superior
- Deploy automático
- Domínios personalizados

## 🔒 Segurança

- ✅ Dados sensíveis mascarados
- ✅ Chaves admin configuráveis
- ✅ Validação de entrada
- ✅ Sanitização de dados

## 📋 Checklist de Deploy

- [ ] Configurar número do WhatsApp
- [ ] Definir chave admin segura
- [ ] Testar todas as funcionalidades
- [ ] Verificar responsividade
- [ ] Testar em diferentes dispositivos
- [ ] Configurar domínio (opcional)

## 🤝 Contribuição

Este é um projeto privado para o Estúdio 23.

## 📄 Licença

Proprietário - Estúdio 23

---

**Desenvolvido com ❤️ para o Estúdio 23**
