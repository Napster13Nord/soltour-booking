/**
 * Página de Detalhes do Pacote - BeautyTravel
 * Layout: Carrossel ESQUERDA + Informações DIREITA
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
            showError($container, 'Pacote não encontrado', 'Por favor, volte à página de resultados e selecione um pacote novamente.');
            return;
        }

        let packageData;
        try {
            packageData = JSON.parse(stored);
            console.log('✅ [DETAILS] Dados carregados do sessionStorage:', packageData);
        } catch (e) {
            console.error('❌ [DETAILS] Erro ao fazer parse dos dados:', e);
            showError($container, 'Erro ao carregar os dados', 'Os dados do pacote estão corrompidos. Volte aos resultados e tente novamente.');
            return;
        }

        // Validar dados essenciais
        if (!packageData.budget || !packageData.hotelInfo) {
            console.error('❌ [DETAILS] Dados incompletos:', packageData);
            showError($container, 'Dados incompletos', 'Por favor, volte aos resultados e selecione o pacote novamente.');
            return;
        }

        // Renderizar página
        renderPackageDetails($container, packageData);
    }

    /**
     * Mostra mensagem de erro
     */
    function showError($container, title, message) {
        $container.html(`
            <div class="bt-quote-error">
                <h3>${title}</h3>
                <p>${message}</p>
                <button class="bt-back-button" onclick="window.history.back()">
                    ← Voltar aos resultados
                </button>
            </div>
        `);
    }

    /**
     * Renderiza os detalhes do pacote - LAYOUT ESPECÍFICO
     */
    function renderPackageDetails($container, packageData) {
        console.log('🎨 [DETAILS] Renderizando página de detalhes...');

        const budget = packageData.budget;
        const hotelInfo = packageData.hotelInfo;
        const hotelService = budget.hotelServices && budget.hotelServices[0];
        const searchParams = packageData.searchParams || {};

        // EXTRAIR DADOS

        // Imagens
        let hotelImages = [];
        if (hotelInfo && hotelInfo.images) {
            hotelImages = hotelInfo.images.map(img => img.url).slice(0, 10);
        }

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

        // Datas
        let datesText = '';
        if (hotelService && hotelService.startDate && hotelService.endDate) {
            const startDate = new Date(hotelService.startDate);
            const endDate = new Date(hotelService.endDate);
            datesText = formatDatePT(startDate) + ' - ' + formatDatePT(endDate);
        }

        // Regime alimentar
        const mealPlan = hotelService && hotelService.mealPlan ?
            (hotelService.mealPlan.description || hotelService.mealPlan.code || '') : '';

        // Preços
        const price = budget.price || budget.totalPrice || 0;
        const numPax = budget.numPax || 2;
        const pricePerPerson = numPax > 0 ? (price / numPax) : price;

        // RENDERIZAR LAYOUT
        $container.html(`
            <button class="bt-back-button" onclick="window.history.back()" style="margin-bottom: 20px;">
                ← Voltar aos resultados
            </button>

            <div class="package-details-layout">
                <!-- ESQUERDA: Carrossel -->
                <div class="package-details-left">
                    <div class="package-details-carousel" id="details-carousel">
                        ${renderCarousel(hotelImages)}
                    </div>
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
                                    <span class="info-value">${mealPlan}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">📅</span>
                                <div>
                                    <span class="info-label">Datas</span>
                                    <span class="info-value">${datesText}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="package-description" id="package-description">
                        <h3>Sobre o hotel</h3>
                        <p style="color: #999;">Carregando descrição...</p>
                    </div>

                    <div class="package-services" id="package-services">
                        <h3>Serviços e Comodidades</h3>
                        <p style="color: #999;">Carregando serviços...</p>
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

        // Inicializar carrossel
        initializeCarousel();

        // Buscar detalhes do hotel e enriquecer
        fetchAndEnrichHotelDetails(packageData);

        // Configurar botão de cotação
        setupQuoteButton(packageData);
    }

    /**
     * Renderiza o carrossel de imagens
     */
    function renderCarousel(images) {
        if (!images || images.length === 0) {
            return '<div class="no-images">Sem imagens disponíveis</div>';
        }

        let html = '<div class="carousel-images">';
        images.forEach((img, idx) => {
            html += `<div class="carousel-image ${idx === 0 ? 'active' : ''}" style="background-image: url('${img}')"></div>`;
        });
        html += '</div>';

        if (images.length > 1) {
            html += '<button class="carousel-btn carousel-prev">‹</button>';
            html += '<button class="carousel-btn carousel-next">›</button>';
            html += '<div class="carousel-dots">';
            images.forEach((_, idx) => {
                html += `<span class="carousel-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>`;
            });
            html += '</div>';
        }

        return html;
    }

    /**
     * Inicializa o carrossel
     */
    function initializeCarousel() {
        const $carousel = $('#details-carousel');
        if ($carousel.length === 0) return;

        let currentIndex = 0;
        const $images = $carousel.find('.carousel-image');
        const $dots = $carousel.find('.carousel-dot');
        const totalImages = $images.length;

        if (totalImages <= 1) return;

        function goToSlide(index) {
            currentIndex = index;
            $images.removeClass('active').eq(index).addClass('active');
            $dots.removeClass('active').eq(index).addClass('active');
        }

        $carousel.find('.carousel-next').on('click', function() {
            goToSlide((currentIndex + 1) % totalImages);
        });

        $carousel.find('.carousel-prev').on('click', function() {
            goToSlide((currentIndex - 1 + totalImages) % totalImages);
        });

        $dots.on('click', function() {
            goToSlide(parseInt($(this).data('index')));
        });
    }

    /**
     * Busca detalhes do hotel e enriquece a página
     */
    function fetchAndEnrichHotelDetails(packageData) {
        console.log('📡 [DETAILS] Buscando detalhes do hotel via AJAX...');

        $.ajax({
            url: soltourData.ajaxurl,
            type: 'POST',
            data: {
                action: 'soltour_get_package_details',
                nonce: soltourData.nonce,
                avail_token: packageData.availToken,
                budget_id: packageData.budgetId,
                hotel_code: packageData.hotelCode,
                provider_code: packageData.providerCode
            },
            success: function(response) {
                console.log('✅ [DETAILS] Resposta do hotel/details:', response);

                if (!response.success) {
                    console.warn('⚠️ [DETAILS] API retornou erro');
                    return;
                }

                const data = response.data || {};
                const hotelDetails = data.hotelDetails || data.details || {};
                const hotel = hotelDetails.hotel || {};

                console.log('📋 [DETAILS] Hotel details:', hotel);

                // Atualizar descrição
                if (hotel.description) {
                    $('#package-description').html(`
                        <h3>Sobre o hotel</h3>
                        <p>${hotel.description}</p>
                    `);
                }

                // Atualizar serviços (não disponíveis na API, manter genérico)
                $('#package-services').html(`
                    <h3>Serviços e Comodidades</h3>
                    <p>Resort 5 estrelas com piscinas, restaurantes, bar, Wi-Fi e entretenimento.</p>
                `);
            },
            error: function(xhr, status, error) {
                console.error('❌ [DETAILS] Erro AJAX:', error);
            }
        });
    }

    /**
     * Configura o botão de pedir cotação
     */
    function setupQuoteButton(packageData) {
        console.log('🔧 [DETAILS] Configurando botão de cotação...');

        $('#btn-request-quote').on('click', function() {
            console.log('🎯 [DETAILS] Botão "Pedir cotação" clicado');
            console.log('📦 [DETAILS] PackageData completo:', packageData);

            // Preparar dados COMPLETOS para cotação (mesmo formato que a página de resultados)
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

            console.log('💾 [DETAILS] Salvando dados para cotação:', quoteData);

            // Salvar no sessionStorage (MESMA chave que o fluxo normal)
            sessionStorage.setItem('soltour_selected_package', JSON.stringify(quoteData));

            // Também salvar em allUniqueHotels caso o quote-page.js precise
            const hotelsArray = [{
                budget: packageData.budget,
                hotelCode: packageData.hotelCode,
                providerCode: packageData.providerCode,
                details: {}
            }];

            // Preparar objeto completo para o fluxo de cotação
            const resultsData = {
                availToken: packageData.availToken,
                allUniqueHotels: hotelsArray,
                hotelsFromAvailability: {},
                flightsFromAvailability: {},
                searchParams: packageData.searchParams,
                numRoomsSearched: packageData.numRoomsSearched || 1
            };

            // Adicionar hotel ao mapa
            resultsData.hotelsFromAvailability[packageData.hotelCode] = packageData.hotelInfo;

            // Adicionar voo se existir
            if (packageData.flightData) {
                resultsData.flightsFromAvailability[packageData.flightData.id || '100'] = packageData.flightData;
            }

            sessionStorage.setItem('soltour_search_results', JSON.stringify(resultsData));

            console.log('✅ [DETAILS] Dados salvos, redirecionando para cotação...');

            // Redirecionar para página de cotação
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

    /**
     * Formata data em português
     */
    function formatDatePT(date) {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
    }

    // Inicializar quando o DOM estiver pronto
    $(document).ready(function() {
        initPackageDetailsPage();
    });

})(jQuery);
