# Volta ao Mundo - Mapa Musical 🌍🎵

Um mapa interativo e dinâmico que permite explorar o mundo através da música. Ao clicar em qualquer país (ou estados do Brasil e EUA), você pode ouvir músicas marcantes, ver a foto do artista e reproduzir um player integrado do YouTube.

## 🚀 Funcionalidades

- **Mapa Interativo:** Feito com [Leaflet.js](https://leafletjs.com/) e camadas GeoJSON detalhadas para o mundo inteiro, incluindo subdivisões de estados para o Brasil e EUA.
- **Player Integrado:** Reproduz vídeos diretamente no painel lateral usando embeds otimizados do YouTube.
- **Autopreenchimento Inteligente:** Ao cadastrar uma música, basta colar o link do YouTube e o sistema preenche automaticamente o título da música e o nome do artista.
- **Armazenamento Simples:** Todas as músicas e dados são armazenados de forma estruturada no arquivo [`songs.yml`](songs.yml).
- **Painel de Edição Local:** Um script PHP leve ([`save_song.php`](save_song.php)) permite adicionar e editar músicas diretamente pela interface gráfica ao rodar localmente.

---

## 🛠️ Como Executar o Projeto Localmente

Para rodar o projeto e poder cadastrar novas músicas:

1. **Pré-requisitos:** Certifique-se de ter o **PHP** instalado em sua máquina (pode ser via WampServer, XAMPP ou PHP standalone).
2. **Clonar o Repositório:**
   ```bash
   git clone <URL_DO_SEU_REPOSITORIO>
   cd volta-ao-mundo
   ```
3. **Iniciar o Servidor Local:**
   Abra o terminal na pasta do projeto e execute:
   ```bash
   php -S localhost:8000
   ```
4. **Acessar no Navegador:**
   Abra o endereço [http://localhost:8000](http://localhost:8000).

*Nota: Se você rodar apenas abrindo o arquivo `index.html` diretamente, você conseguirá visualizar o mapa, mas a função de salvar novas músicas não funcionará por restrições de segurança do navegador.*

---

## 📦 Estrutura de Arquivos

- `index.html` - Estrutura da aplicação e interface do usuário (sidebar e mapa).
- `style.css` - Estilização moderna com design escuro, efeitos neon e glassmorphism.
- `app.js` - Lógica do mapa, renderização das camadas GeoJSON e requisições de salvamento.
- `save_song.php` - Script backend que recebe os novos dados e atualiza o arquivo YAML.
- `songs.yml` - Banco de dados das músicas cadastradas.
- `*.geojson` - Dados geográficos para delimitação e interatividade dos países e estados.

---

## 📄 Licença

Este projeto está sob a licença **Creative Commons Atribuição-NãoComercial (CC BY-NC 4.0)** combinada com termos proprietários. 

Isso significa que você é livre para estudar, rodar e hospedar o projeto de forma pessoal e sem fins lucrativos. **Qualquer cópia, redistribuição ou uso comercial para ganho financeiro sem autorização expressa do autor é estritamente proibida.** Consulte o arquivo [`LICENSE`](LICENSE) para mais detalhes.
