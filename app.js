// Inicialização do Mapa Leaflet
const map = L.map('map', {
    center: [20, 10],
    zoom: 2,
    minZoom: 2,
    maxZoom: 7,
    maxBounds: [[-85, -180], [85, 180]],
    zoomControl: false // Vamos adicionar o controle personalizado na posição certa
});

// Adiciona os botões de zoom na parte superior esquerda
L.control.zoom({
    position: 'topleft'
}).addTo(map);

// Adiciona botão personalizado de resetar zoom ao mesmo controle de zoom
const zoomContainer = document.querySelector('.leaflet-control-zoom');
if (zoomContainer) {
    const resetBtn = document.createElement('a');
    resetBtn.className = 'leaflet-control-zoom-reset';
    resetBtn.href = '#';
    resetBtn.title = 'Visualização Geral (Resetar Zoom)';
    resetBtn.role = 'button';
    resetBtn.ariaLabel = 'Resetar Zoom';
    resetBtn.innerHTML = '⛶';
    
    resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        map.setView([20, 10], 2);
        sidebar.classList.add('hidden');
        resetHighlightStyle();
    });
    
    zoomContainer.appendChild(resetBtn);
}


// Elementos da Interface (UI)
const sidebar = document.getElementById('song-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');
const sidebarCountryName = document.getElementById('sidebar-country-name');
const sidebarArtistImage = document.getElementById('sidebar-artist-image');
const artistGlow = document.getElementById('artist-glow');
const sidebarSongLink = document.getElementById('sidebar-song-link');
const sidebarImageLink = document.getElementById('sidebar-image-link');
const sidebarArtistName = document.getElementById('sidebar-artist-name');
const spotifyPlayerWrapper = document.getElementById('spotify-player-wrapper');
const statsCounter = document.getElementById('stats-counter');
const btnPlaylistGeral = document.getElementById('btn-playlist-geral');

const usStateAbbr = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
    'District of Columbia': 'DC', 'Puerto Rico': 'PR'
};

let songsData = {};
let geojsonLayer = null;
let brLayer = null;
let usLayer = null;
let currentCountryCode = '';
let currentCountryName = '';
let currentCoords = [0, 0];

// Detecta se está rodando em ambiente local (localhost ou 127.0.0.1)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Novos elementos do formulário de edição
const sidebarViewMode = document.getElementById('sidebar-view-mode');
const sidebarEditMode = document.getElementById('sidebar-edit-mode');
const btnEditMode = document.getElementById('btn-edit-mode');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const btnSaveSong = document.getElementById('btn-save-song');
const inputYoutubeUrl = document.getElementById('input-youtube-url');
const inputSongName = document.getElementById('input-song-name');
const inputArtistName = document.getElementById('input-artist-name');
const inputArtistImage = document.getElementById('input-artist-image');

// Oculta o botão de edição se não estiver localmente
if (!isLocal && btnEditMode) {
    btnEditMode.style.display = 'none';
}

// Fecha a barra lateral ao clicar no botão de fechar
closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.add('hidden');
    // Remove o destaque temporário se houver
    resetHighlightStyle();
});

// Fechar sidebar ao clicar no mapa (mas não nas formas)
map.on('click', (e) => {
    if (e.originalEvent.target.id === 'map') {
        sidebar.classList.add('hidden');
        resetHighlightStyle();
    }
});

// Helper para obter o código identificador da feature (país ou estado)
function getFeatureCode(feature) {
    let code = feature.properties['ISO3166-1-Alpha-3'];

    // Corrige erro de dados do GeoJSON onde alguns países vêm com código "-99"
    if (code === '-99' && feature.properties.name) {
        const nameMap = {
            'France': 'FRA',
            'Norway': 'NOR',
            'Somaliland': 'SOM',
            'Kosovo': 'XKX',
            'Northern Cyprus': 'CYN'
        };
        if (nameMap[feature.properties.name]) {
            code = nameMap[feature.properties.name];
        }
    }

    if (code && code !== '-99') {
        return code;
    }
    // Brasil (sigla do estado, ex: AC, SP)
    if (feature.properties.sigla) {
        return 'BR-' + feature.properties.sigla;
    }
    // EUA (nome do estado, mapeia para sigla postal)
    if (feature.properties.name && usStateAbbr[feature.properties.name]) {
        return 'US-' + usStateAbbr[feature.properties.name];
    }
    return feature.properties.id || feature.properties.name || '';
}

// Helper para obter o nome amigável para exibição
function getFeatureName(feature) {
    if (feature.properties['ISO3166-1-Alpha-3']) {
        return feature.properties.name;
    }
    if (feature.properties.sigla) {
        return `${feature.properties.name} (Brasil)`;
    }
    if (feature.properties.name && usStateAbbr[feature.properties.name]) {
        return `${feature.properties.name} (EUA)`;
    }
    return feature.properties.name || '';
}

// Helper para obter o objeto de camada Leaflet correspondente à feature
function getLayerForFeature(feature) {
    if (feature.properties['ISO3166-1-Alpha-3']) {
        return geojsonLayer;
    } else if (feature.properties.sigla) {
        return brLayer;
    } else {
        return usLayer;
    }
}

// Carregar os arquivos
async function init() {
    try {
        // 1. Carrega o arquivo de músicas YAML (evitando cache do navegador)
        const yamlResponse = await fetch(`songs.yml?t=${Date.now()}`);
        const yamlText = await yamlResponse.text();
        songsData = jsyaml.load(yamlText);

        // Atualiza a playlist geral no cabeçalho
        if (songsData.playlist_geral) {
            btnPlaylistGeral.href = songsData.playlist_geral;
        }

        // 2. Carrega o GeoJSON do mundo
        const geojsonResponse = await fetch('world.geojson');
        const geojsonData = await geojsonResponse.json();

        // 3. Carrega o GeoJSON do Brasil
        const brResponse = await fetch('brazil_states.geojson');
        const brData = await brResponse.json();
        const brStatesTotalCount = brData.features.length;

        // 4. Carrega o GeoJSON dos EUA
        const usResponse = await fetch('us_states.geojson');
        const usData = await usResponse.json();
        const usStatesTotalCount = usData.features.length;

        // Atualiza o contador de países visitados
        let exploredCount = 0;
        const keys = Object.keys(songsData.countries || {});
        
        // Países normais (excluindo BRA e USA se estiverem lá, e chaves de estado de 3 letras que não existem)
        const normalCountries = keys.filter(k => k.length === 3 && k !== 'BRA' && k !== 'USA');
        exploredCount += normalCountries.length;
        
        // Brasil (só soma 1 se todos os estados estiverem preenchidos)
        const brVisited = keys.filter(k => k.startsWith('BR-')).length;
        if (brVisited === brStatesTotalCount) {
            exploredCount += 1;
        }
        
        // EUA (só soma 1 se todos os estados estiverem preenchidos)
        const usVisited = keys.filter(k => k.startsWith('US-')).length;
        if (usVisited === usStatesTotalCount) {
            exploredCount += 1;
        }
        
        statsCounter.textContent = exploredCount;

        // 5. Renderiza as camadas no mapa
        renderGeoJson(geojsonData, brData, usData, songsData.countries);

    } catch (error) {
        console.error('Erro ao inicializar o mapa:', error);
    }
}

// Funções de Estilo para o GeoJSON
function getFeatureStyle(code, activeCountries) {
    const hasSong = activeCountries && activeCountries[code];
    return {
        fillColor: hasSong ? '#1db954' : '#141a29', // Verde Spotify para ativos, azul escuro opaco para outros
        weight: 1,
        opacity: 1,
        color: hasSong ? '#00f2fe' : '#222d44', // Borda brilhante azul neon para ativos, borda escura para outros
        fillOpacity: hasSong ? 0.85 : 0.6,
        className: hasSong ? 'country-active' : 'country-inactive'
    };
}

let activeHighlightedFeature = null;

function highlightFeature(e) {
    const layer = e.target;
    const code = getFeatureCode(layer.feature);
    const hasSong = songsData.countries && songsData.countries[code];

    if (hasSong) {
        layer.setStyle({
            fillColor: '#1ed760', // Verde Spotify brilhante
            fillOpacity: 0.95,
            weight: 2,
            color: '#ffffff' // Borda branca
        });
        
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    } else {
        layer.setStyle({
            fillColor: '#1d273d',
            fillOpacity: 0.8
        });
    }
}

function resetHighlight(e) {
    const layer = e.target;
    
    // Se for o país/estado que está atualmente aberto no sidebar, mantemos um destaque visual diferente
    if (activeHighlightedFeature === layer) {
        layer.setStyle({
            fillColor: '#1ed760',
            fillOpacity: 0.95,
            weight: 2,
            color: '#00f2fe'
        });
        return;
    }

    const parentLayer = getLayerForFeature(layer.feature);
    if (parentLayer) {
        parentLayer.resetStyle(layer);
    }
}

function resetHighlightStyle() {
    if (activeHighlightedFeature) {
        const parentLayer = getLayerForFeature(activeHighlightedFeature.feature);
        if (parentLayer) {
            parentLayer.resetStyle(activeHighlightedFeature);
        }
        activeHighlightedFeature = null;
    }
}

// Manipulação do clique em países/estados
function onEachFeature(feature, layer) {
    const code = getFeatureCode(feature);
    const displayName = getFeatureName(feature);
    const countryData = songsData.countries && songsData.countries[code];

    // Se tiver música, adicionamos um tooltip básico
    if (countryData) {
        layer.bindTooltip(`<strong>${countryData.name}</strong><br>🎵 ${countryData.song} - ${countryData.artist}`, {
            direction: 'top',
            sticky: true,
            className: 'custom-tooltip'
        });
    } else {
        layer.bindTooltip(`<strong>${displayName}</strong><br>Sem músicas vinculadas`, {
            direction: 'top',
            sticky: true,
            className: 'custom-tooltip'
        });
    }

    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: (e) => {
            if (countryData) {
                // Centraliza e aproxima o mapa suavemente no país/estado
                map.flyTo(e.latlng, Math.max(map.getZoom(), 4), {
                    duration: 1.2
                });

                // Define o país/estado atualmente em destaque
                resetHighlightStyle();
                activeHighlightedFeature = layer;
                
                // Reaplica estilo de ativo
                layer.setStyle({
                    fillColor: '#1ed760',
                    fillOpacity: 0.95,
                    weight: 2,
                    color: '#00f2fe'
                });

                currentCountryCode = code;
                currentCountryName = countryData.name || displayName;
                currentCoords = countryData.coords || [e.latlng.lat, e.latlng.lng];

                // Exibe em Modo de Visualização
                switchToViewMode();
                showSongDetails(countryData);
            } else {
                // Centraliza e aproxima o mapa suavemente no país/estado vazio
                map.flyTo(e.latlng, Math.max(map.getZoom(), 4), {
                    duration: 1.2
                });

                resetHighlightStyle();
                activeHighlightedFeature = layer;
                
                layer.setStyle({
                    fillColor: '#00f2fe',
                    fillOpacity: 0.5,
                    weight: 2,
                    color: '#00f2fe'
                });

                currentCountryCode = code;
                currentCountryName = displayName;
                currentCoords = [e.latlng.lat, e.latlng.lng];

                clearSongDetails();
                if (sidebarCountryName) sidebarCountryName.textContent = displayName;

                if (isLocal) {
                    // Abre diretamente no Modo de Edição no local
                    switchToEditMode();
                    clearEditForm();
                } else {
                    // No GitHub Pages, mostra apenas um texto indicando que não há música
                    switchToViewMode();
                    if (sidebarArtistName) sidebarArtistName.textContent = 'Sem músicas vinculadas';
                    if (spotifyPlayerWrapper) {
                        spotifyPlayerWrapper.innerHTML = `
                            <div style="text-align: center; color: var(--text-secondary); padding: 20px 0; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;">
                                <p style="margin: 0; font-size: 0.9rem;">Cadastros e edições só podem ser feitos a partir do painel administrativo local.</p>
                            </div>
                        `;
                    }
                }
                if (sidebar) sidebar.classList.remove('hidden');
            }
        }
    });
}

// Renderiza as camadas GeoJSON (Mundo filtrado, BR e US)
function renderGeoJson(geojsonData, brData, usData, activeCountries) {
    if (geojsonLayer) map.removeLayer(geojsonLayer);
    if (brLayer) map.removeLayer(brLayer);
    if (usLayer) map.removeLayer(usLayer);

    // 1. Camada do mundo (filtrando Brasil e EUA)
    geojsonLayer = L.geoJSON(geojsonData, {
        filter: (feature) => {
            const iso = feature.properties['ISO3166-1-Alpha-3'];
            return iso !== 'BRA' && iso !== 'USA';
        },
        style: (feature) => getFeatureStyle(getFeatureCode(feature), activeCountries),
        onEachFeature: onEachFeature
    }).addTo(map);

    // 2. Camada do Brasil
    brLayer = L.geoJSON(brData, {
        style: (feature) => getFeatureStyle(getFeatureCode(feature), activeCountries),
        onEachFeature: onEachFeature
    }).addTo(map);

    // 3. Camada dos EUA
    usLayer = L.geoJSON(usData, {
        style: (feature) => getFeatureStyle(getFeatureCode(feature), activeCountries),
        onEachFeature: onEachFeature
    }).addTo(map);
}
function clearSongDetails() {
    if (sidebarSongLink) {
        sidebarSongLink.textContent = '';
        sidebarSongLink.href = '#';
    }
    if (sidebarImageLink) {
        sidebarImageLink.href = '#';
    }
    if (sidebarArtistName) sidebarArtistName.textContent = '';
    if (sidebarArtistImage) {
        sidebarArtistImage.src = '';
        sidebarArtistImage.style.display = 'none';
    }
    if (artistGlow) {
        artistGlow.style.backgroundImage = 'none';
        artistGlow.style.display = 'none';
    }
    if (spotifyPlayerWrapper) {
        spotifyPlayerWrapper.innerHTML = '';
    }
}

function showSongDetails(data) {
    clearSongDetails();
    if (!data) {
        console.error("Dados da música não fornecidos.");
        return;
    }
    if (sidebarCountryName) sidebarCountryName.textContent = data.name;
    if (sidebarSongLink) {
        sidebarSongLink.textContent = data.song;
        sidebarSongLink.href = data.youtube_url || '#';
    }
    if (sidebarImageLink) {
        sidebarImageLink.href = data.youtube_url || '#';
    }
    if (sidebarArtistName) sidebarArtistName.textContent = data.artist;

    // Foto do Artista com efeito Blur de fundo
    if (sidebarArtistImage) {
        if (data.artist_image) {
            sidebarArtistImage.src = data.artist_image;
            sidebarArtistImage.style.display = 'block';
            if (artistGlow) {
                artistGlow.style.backgroundImage = `url('${data.artist_image}')`;
                artistGlow.style.display = 'block';
            }
        } else {
            sidebarArtistImage.style.display = 'none';
            if (artistGlow) artistGlow.style.display = 'none';
        }
    }

    // Embed YouTube Player
    if (spotifyPlayerWrapper) {
        if (data.youtube_id) {
            spotifyPlayerWrapper.innerHTML = `
                <iframe 
                    width="100%" 
                    height="200" 
                    src="https://www.youtube.com/embed/${data.youtube_id}?autoplay=1" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerpolicy="strict-origin-when-cross-origin" 
                    allowfullscreen
                    style="border-radius: 12px; border: none; background-color: #000;">
                </iframe>
            `;
        } else if (data.youtube_url) {
            spotifyPlayerWrapper.innerHTML = `
                <a href="${data.youtube_url}" target="_blank" class="btn btn-primary" style="width: 100%; justify-content: center; background-color: #ff0000; box-shadow: 0 4px 14px rgba(255, 0, 0, 0.4);">
                    Ouvir no YouTube
                </a>
            `;
        } else {
            spotifyPlayerWrapper.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">Link do YouTube indisponível</p>`;
        }
    }

    if (sidebar) sidebar.classList.remove('hidden');
}

function switchToViewMode() {
    if (sidebarViewMode) sidebarViewMode.classList.remove('hidden');
    if (sidebarEditMode) sidebarEditMode.classList.add('hidden');
}

function switchToEditMode() {
    if (sidebarViewMode) sidebarViewMode.classList.add('hidden');
    if (sidebarEditMode) sidebarEditMode.classList.remove('hidden');
}

function clearEditForm() {
    if (inputYoutubeUrl) inputYoutubeUrl.value = '';
    if (inputSongName) inputSongName.value = '';
    if (inputArtistName) inputArtistName.value = '';
    if (inputArtistImage) inputArtistImage.value = '';
}

function extractYoutubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Auto-preenche informações da música ao colar link do YouTube
if (inputYoutubeUrl) {
    inputYoutubeUrl.addEventListener('input', async () => {
        const url = inputYoutubeUrl.value.trim();
        const videoId = extractYoutubeId(url);
        if (videoId) {
            try {
                const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
                const data = await response.json();
                if (data && data.title) {
                    const parts = data.title.split('-');
                    if (parts.length >= 2) {
                        if (inputArtistName) inputArtistName.value = parts[0].trim();
                        if (inputSongName) inputSongName.value = parts.slice(1).join('-').trim();
                    } else {
                        if (inputSongName) inputSongName.value = data.title.trim();
                        if (inputArtistName) inputArtistName.value = '';
                    }
                }
            } catch (error) {
                console.error("Erro ao puxar dados do YouTube:", error);
            }
        }
    });
}

// Botões do Painel de Edição
if (btnEditMode) {
    btnEditMode.addEventListener('click', () => {
        switchToEditMode();
        const currentData = songsData.countries && songsData.countries[currentCountryCode];
        if (currentData) {
            if (inputYoutubeUrl) inputYoutubeUrl.value = currentData.youtube_url || '';
            if (inputSongName) inputSongName.value = currentData.song || '';
            if (inputArtistName) inputArtistName.value = currentData.artist || '';
            if (inputArtistImage) inputArtistImage.value = currentData.artist_image || '';
        }
    });
}

if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', () => {
        const currentData = songsData.countries && songsData.countries[currentCountryCode];
        if (currentData) {
            switchToViewMode();
        } else {
            sidebar.classList.add('hidden');
            resetHighlightStyle();
        }
    });
}

if (btnSaveSong) {
    btnSaveSong.addEventListener('click', async () => {
        const url = inputYoutubeUrl.value.trim();
        const songName = inputSongName.value.trim();
        const artistName = inputArtistName.value.trim();
        const artistImage = inputArtistImage.value.trim();
        
        const videoId = extractYoutubeId(url);
        if (!videoId) {
            alert('Por favor, insira um link válido do YouTube.');
            return;
        }
        if (!songName || !artistName) {
            alert('Por favor, preencha o nome da música e do artista.');
            return;
        }

        if (!songsData.countries) {
            songsData.countries = {};
        }

        songsData.countries[currentCountryCode] = {
            name: currentCountryName,
            song: songName,
            artist: artistName,
            artist_image: artistImage,
            youtube_url: url,
            youtube_id: videoId,
            coords: currentCoords
        };

        const updatedYaml = jsyaml.dump(songsData);

        try {
            const response = await fetch('save_song.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: updatedYaml
            });

            const rawText = await response.text();
            let result;
            try {
                result = JSON.parse(rawText);
            } catch (jsonErr) {
                throw new Error("Resposta do servidor inválida (Não é JSON).");
            }
            
            if (result.status === 'success') {
                alert('Música salva com sucesso!');
                await init();
                switchToViewMode();
                showSongDetails(songsData.countries[currentCountryCode]);
            } else {
                alert('Erro ao salvar música: ' + result.message);
            }
        } catch (error) {
            console.error('Erro na requisição de salvar:', error);
            alert('Erro de conexão com o servidor PHP.');
        }
    });
}

// Inicia o app ao carregar a página
window.addEventListener('load', () => {
    init();
    setTimeout(() => {
        map.invalidateSize();
    }, 200);
});
