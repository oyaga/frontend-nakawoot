# NakaWoot Frontend

<p align="center">
  <strong>🚀 Interface de gerenciamento para integrações NakaWoot</strong>
</p>

O **NakaWoot Frontend** é a interface oficial para configurar e gerenciar instâncias do [Evolution API](https://github.com/EvolutionAPI/evolution-api), conectando-as ao [Chatwoot](https://chatwoot.com) e [Typebot](https://typebot.io).

---

## ✨ Funcionalidades

- **Gerenciamento de Instâncias** — Crie, configure e monitore instâncias do Evolution API
- **Integração Chatwoot** — Configure inboxes, tokens e webhooks
- **Integração Typebot** — Conecte fluxos de automação
- **Dashboard em Tempo Real** — Monitore conversas e métricas
- **Tema Personalizável** — Suporte a modo claro/escuro

---

## 🛠️ Tech Stack

| Tecnologia                               | Descrição                |
| ---------------------------------------- | ------------------------ |
| [Next.js 15](https://nextjs.org)         | Framework React          |
| [ShadCN UI](https://ui.shadcn.com)       | Componentes de interface |
| [Tailwind CSS](https://tailwindcss.com)  | Estilização              |
| [Lucide Icons](https://lucide.dev)       | Ícones                   |
| [TypeScript](https://typescriptlang.org) | Tipagem estática         |

---

## 🚀 Getting Started

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/oyaga/frontend-nakawoot.git
cd frontend-nakawoot

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver a aplicação.

---

## 📦 Build para Produção

```bash
npm run build
npm start
```

---

## 🐳 Docker

```bash
| Tag                     | Descrição                  |
| ----------------------- | -------------------------- |
| `oyaga/nakawoot:latest` | Última versão estável      |
| `oyaga/nakawoot:stable` | Versão de produção testada |
```

---

## 📄 Licença

Este projeto é open source sob a licença MIT.

---

<p align="center">
  Feito com ❤️ pela comunidade NakaWoot
</p>
