/**
 * Página de Detalhes do Pacote - BeautyTravel
 * Usa MESMA estrutura da página de resultados
 */

(function($) {
    'use strict';

    // MAPEAMENTOS
    const DESTINATIONS_MAP = {
        'PUJ': { country: 'República Dominicana', city: 'Punta Cana' },
        'SDQ': { country: 'República Dominicana', city: 'Santo Domingo' },
        'STI': { country: 'República Dominicana', city: 'Santiago' },
        'LRM': { country: 'República Dominicana', city: 'La Romana' },
        'AUA': { country: 'Aruba', city: 'Oranjestad' },
        'CUN': { country: 'México', city: 'Cancún' },
        'CZM': { country: 'México', city: 'Cozumel' },
        'VRA': { country: 'Cuba', city: 'Varadero' },
        'HAV': { country: 'Cuba', city: 'Havana' },
        'MBJ': { country: 'Jamaica', city: 'Montego Bay' }
    };

    const ORIGINS_MAP = {
        'LIS': 'Lisboa',
        'OPO': 'Porto',
        'FAO': 'Faro',
        'MAD': 'Madrid',
        'BCN': 'Barcelona',
        'SVQ': 'Sevilha',
        'BIO': 'Bilbau',
        'VLC': 'Valência'
    };

    /**
     * Inicializa a página de detalhes
     */
    function initPackageDetailsPage() {
        const $container = $('#soltour-package-details-page');
        if ($container.length === 0) return;

        console.log('🔍 [DETAILS] Inicializando página de detalhes...');

        // Buscar dados do sessionStorage
        const stored = sessionStorage.getItem('soltour_selected_package_details');

        if (!stored) {
            console.error('❌ [DETAILS] Dados não encontrados no sessionStorage');
            showError($container);
            return;
        }

        let packageData;
        try {
            packageData = JSON.parse(stored);
            console.log('✅ [DETAILS] Dados carregados:', packageData);
        } catch (e) {
            console.error('❌ [DETAILS] Erro ao fazer parse:', e);
            showError($container);
            return;
        }

        // Validar dados essenciais
        if (!packageData.budget || !packageData.hotelInfo) {
            console.error('❌ [DETAILS] Dados incompletos:', packageData);
            showError($container);
            return;
        }

        // Renderizar página
        renderPackageDetails($container, packageData);
    }

    /**
     * Mostra mensagem de erro
     */
    function showError($container) {
        $container.html(`
            <div class="bt-quote-error">
                <h3>Pacote não encontrado</h3>
                <p>Por favor, volte à página de resultados e selecione um pacote novamente.</p>
                <button class="bt-back-button" onclick="window.history.back()">← Voltar aos resultados</button>
            </div>
        `);
    }

    /**
     * Renderiza os detalhes do pacote
     */
    function renderPackageDetails($container, packageData) {
        console.log('🎨 [DETAILS] Renderizando detalhes...');

        const budget = packageData.budget;
        const hotelInfo = packageData.hotelInfo;
        const hotelService = budget.hotelServices && budget.hotelServices[0];
        const searchParams = packageData.searchParams || {};
        const selectedRoom = packageData.selectedRoom || {};

        // EXTRAIR IMAGENS (mesma lógica dos resultados)
        let hotelImages = [];
        if (hotelInfo && hotelInfo.multimedias) {
            hotelImages = hotelInfo.multimedias.map(img => img.url).slice(0, 10);
        }

        console.log('📸 [DETAILS] Imagens encontradas:', hotelImages.length);

        // País e Cidade
        const destinationCode = hotelInfo.destinationCode || '';
        const destInfo = DESTINATIONS_MAP[destinationCode];
        const country = destInfo ? destInfo.country : '';
        const city = hotelInfo.destinationDescription || (destInfo ? destInfo.city : '');

        // Nome do hotel
        const hotelName = hotelInfo.name || budget.hotelName || 'Hotel';

        // Estrelas
        let hotelStars = 0;
        if (hotelInfo.categoryCode) {
            hotelStars = (hotelInfo.categoryCode.match(/\*/g) || []).length;
        }

        // Origem
        const originCity = ORIGINS_MAP[searchParams.origin_code] || searchParams.origin_code || 'Lisboa';

        // Noites
        let numNights = searchParams.num_nights || 7;
        if (hotelService && hotelService.startDate && hotelService.endDate) {
            const start = new Date(hotelService.startDate);
            const end = new Date(hotelService.endDate);
            numNights = Math.round((end - start) / (1000 * 60 * 60 * 24));
        }

        // Datas formatadas
        let datesText = '';
        if (hotelService && hotelService.startDate && hotelService.endDate) {
            const startDate = new Date(hotelService.startDate);
            const endDate = new Date(hotelService.endDate);
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            datesText = `${startDate.getDate()} ${months[startDate.getMonth()]} ${startDate.getFullYear()} - ${endDate.getDate()} ${months[endDate.getMonth()]} ${endDate.getFullYear()}`;
        }

        // Regime alimentar
        const mealPlan = hotelService && hotelService.mealPlan ?
            (hotelService.mealPlan.description || hotelService.mealPlan.code || '') : '';

        // Preços
        const price = budget.priceBreakdown?.priceBreakdownDetails?.[0]?.priceInfo?.pvp || 0;
        const numPax = budget.numPax || 2;
        const pricePerPerson = numPax > 0 ? (price / numPax) : price;

        console.log('💰 [DETAILS] Preços:', { price, numPax, pricePerPerson });

        // CARROSSEL (mesma estrutura dos resultados)
        let sliderHTML = '';
        if (hotelImages.length > 0) {
            sliderHTML = `
                <div class="package-image-slider">
                    <div class="slider-images">
                        ${hotelImages.map((img, index) => `
                            <img src="${img}" alt="${hotelName}" class="slider-image ${index === 0 ? 'active' : ''}" />
                        `).join('')}
                    </div>
                    ${hotelImages.length > 1 ? `
                        <button class="slider-btn slider-prev" onclick="SoltourApp.changeSlide(this, -1)">❮</button>
                        <button class="slider-btn slider-next" onclick="SoltourApp.changeSlide(this, 1)">❯</button>
                        <div class="slider-dots">
                            ${hotelImages.map((_, index) => `
                                <span class="slider-dot ${index === 0 ? 'active' : ''}" onclick="SoltourApp.goToSlide(this, ${index})"></span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            sliderHTML = `
                <div class="package-image">
                    <div class="no-image">📷 Sem imagem</div>
                </div>
            `;
        }

        // RENDERIZAR LAYOUT (2 colunas: carrossel esquerda + info direita)
        $container.html(`
            <button class="bt-back-button" onclick="window.history.back()" style="margin-bottom: 20px;">
                ← Voltar aos resultados
            </button>

            <div class="package-details-layout">
                <!-- ESQUERDA: Carrossel -->
                <div class="package-details-left">
                    ${sliderHTML}
                </div>

                <!-- DIREITA: Informações -->
                <div class="package-details-right">
                    <div class="package-details-header">
                        <span class="package-location">${city}, ${country}</span>
                        <h1 class="package-title">${hotelName}</h1>
                        <div class="package-stars">
                            ${'⭐'.repeat(hotelStars)}
                        </div>
                    </div>

                    <div class="package-details-info">
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-icon">🏨</span>
                                <div>
                                    <span class="info-label">Categoria</span>
                                    <span class="info-value">${hotelInfo.categoryDescription || hotelStars + ' Estrelas'}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">📍</span>
                                <div>
                                    <span class="info-label">Endereço</span>
                                    <span class="info-value">${hotelInfo.address || city}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">🛫</span>
                                <div>
                                    <span class="info-label">Origem</span>
                                    <span class="info-value">${originCity}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">🌙</span>
                                <div>
                                    <span class="info-label">Duração</span>
                                    <span class="info-value">${numNights} noites</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">🍽️</span>
                                <div>
                                    <span class="info-label">Regime</span>
                                    <span class="info-value">${mealPlan || 'Consultar'}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">📅</span>
                                <div>
                                    <span class="info-label">Datas</span>
                                    <span class="info-value">${datesText}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">🛏️</span>
                                <div>
                                    <span class="info-label">Tipo de Quarto</span>
                                    <span class="info-value">${selectedRoom.description || 'Standard'}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">👥</span>
                                <div>
                                    <span class="info-label">Hóspedes</span>
                                    <span class="info-value">${budget.numPax || 2} pessoas</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="package-description">
                        <h3>Sobre o hotel</h3>
                        <p style="white-space: pre-line; line-height: 1.8;">${hotelInfo.description || 'Informação não disponível'}</p>
                    </div>

                    <div class="package-pricing">
                        <div class="price-breakdown">
                            <div class="price-item">
                                <span class="price-label">Preço por pessoa</span>
                                <span class="price-value">${formatPrice(pricePerPerson)}€</span>
                            </div>
                            <div class="price-item price-total-item">
                                <span class="price-label">Preço total</span>
                                <span class="price-value-total">${formatPrice(price)}€</span>
                            </div>
                        </div>
                        <button class="btn-request-quote" id="btn-request-quote">
                            Pedir cotação deste pacote
                        </button>
                    </div>
                </div>
            </div>
        `);

        // Configurar botão de cotação
        setupQuoteButton(packageData);
    }


    /**
     * Configura o botão de pedir cotação
     */
    function setupQuoteButton(packageData) {
        console.log('🔧 [DETAILS] Configurando botão de cotação...');

        $('#btn-request-quote').on('click', function() {
            console.log('🎯 [DETAILS] Botão "Pedir cotação" clicado');

            // Preparar dados COMPLETOS
            const quoteData = {
                budgetId: packageData.budgetId,
                hotelCode: packageData.hotelCode,
                providerCode: packageData.providerCode,
                availToken: packageData.availToken,
                budget: packageData.budget,
                hotelInfo: packageData.hotelInfo,
                flightData: packageData.flightData,
                selectedRooms: packageData.selectedRooms || [],
                selectedRoom: packageData.selectedRoom || null,
                numRoomsSearched: packageData.numRoomsSearched || 1,
                searchParams: packageData.searchParams || {}
            };

            console.log('💾 [DETAILS] Salvando dados:', quoteData);

            // Salvar dados
            sessionStorage.setItem('soltour_selected_package', JSON.stringify(quoteData));

            // Preparar dados completos para o fluxo de cotação
            const hotelsArray = [{
                budget: packageData.budget,
                hotelCode: packageData.hotelCode,
                providerCode: packageData.providerCode,
                details: {}
            }];

            const resultsData = {
                availToken: packageData.availToken,
                allUniqueHotels: hotelsArray,
                hotelsFromAvailability: {},
                flightsFromAvailability: {},
                searchParams: packageData.searchParams,
                numRoomsSearched: packageData.numRoomsSearched || 1
            };

            resultsData.hotelsFromAvailability[packageData.hotelCode] = packageData.hotelInfo;

            if (packageData.flightData) {
                resultsData.flightsFromAvailability[packageData.flightData.id || '100'] = packageData.flightData;
            }

            sessionStorage.setItem('soltour_search_results', JSON.stringify(resultsData));

            console.log('✅ [DETAILS] Redirecionando para cotação...');

            // Redirecionar
            window.location.href = '/cotacao/?budget=' + encodeURIComponent(packageData.budgetId);
        });
    }

    /**
     * Formata preço
     */
    function formatPrice(price, decimals = 0) {
        const fixed = Number(price).toFixed(decimals);
        return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // Inicializar quando o DOM estiver pronto
    $(document).ready(function() {
        initPackageDetailsPage();
    });

})(jQuery);
