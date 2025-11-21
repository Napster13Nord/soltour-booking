/**
 * Página de Detalhes do Pacote - BeautyTravel
 * Renderiza detalhes completos do hotel/pacote
 * USANDO O MESMO LAYOUT DA PÁGINA DE RESULTADOS
 */

(function($) {
    'use strict';

    // MAPEAMENTOS (mesmos do soltour-booking.js)
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
     * Renderiza os detalhes do pacote usando o MESMO layout dos resultados
     */
    function renderPackageDetails($container, packageData) {
        console.log('🎨 [DETAILS] Renderizando página de detalhes...');

        const budget = packageData.budget;
        const hotelInfo = packageData.hotelInfo;
        const flightData = packageData.flightData;
        const searchParams = packageData.searchParams || {};

        // Criar objeto no mesmo formato do renderCompleteCard
        const pkg = {
            budget: budget,
            details: {},
            hotelCode: packageData.hotelCode
        };

        // Renderizar layout base
        $container.html(`
            <button class="bt-back-button" onclick="window.history.back()" style="margin-bottom: 20px;">
                ← Voltar aos resultados
            </button>
            <div id="package-details-card-container"></div>
        `);

        // Renderizar card usando a MESMA lógica da página de resultados
        const cardHTML = generatePackageCardHTML(pkg, hotelInfo, flightData, searchParams, packageData);
        $('#package-details-card-container').html(cardHTML);

        // Inicializar slider
        initializeImageSlider();

        // Buscar detalhes adicionais do hotel via AJAX
        fetchAndEnrichHotelDetails($container, packageData);
    }

    /**
     * Gera HTML do card (MESMA lógica do renderCompleteCard)
     */
    function generatePackageCardHTML(pkg, hotelInfo, flightData, searchParams, packageData) {
        const budget = pkg.budget;
        const hotelService = budget.hotelServices && budget.hotelServices[0];

        // IMAGENS
        let hotelImages = [];
        if (hotelInfo && hotelInfo.images) {
            hotelImages = hotelInfo.images.map(img => img.url).slice(0, 10);
        }

        // PAÍS e CIDADE
        let country = '';
        let city = '';
        const destinationCode = hotelInfo.destinationCode || '';
        const destInfo = DESTINATIONS_MAP[destinationCode];
        if (destInfo) {
            country = destInfo.country;
            city = hotelInfo.destinationDescription || destInfo.city;
        }

        // NOME DO HOTEL
        const hotelName = hotelInfo.name || budget.hotelName || 'Hotel';
        const hotelCode = hotelInfo.code || packageData.hotelCode || 'N/A';

        // ESTRELAS
        let hotelStars = 0;
        if (hotelInfo.categoryCode) {
            hotelStars = (hotelInfo.categoryCode.match(/\*/g) || []).length;
        }

        // ORIGEM
        const originCity = ORIGINS_MAP[searchParams.origin_code] || searchParams.origin_code || '';

        // NOITES
        let numNights = searchParams.num_nights || 7;
        if (hotelService && hotelService.startDate && hotelService.endDate) {
            const start = new Date(hotelService.startDate);
            const end = new Date(hotelService.endDate);
            numNights = Math.round((end - start) / (1000 * 60 * 60 * 24));
        }

        // REGIME
        const mealPlan = hotelService && hotelService.mealPlan ?
            (hotelService.mealPlan.description || hotelService.mealPlan.code || '') : '';

        // JANELA DE TEMPORADA
        let seasonWindow = '';
        if (hotelService && hotelService.startDate && hotelService.endDate) {
            const startDate = new Date(hotelService.startDate);
            const endDate = new Date(hotelService.endDate);
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            seasonWindow = `${months[startDate.getMonth()]} ${startDate.getDate()} - ${months[endDate.getMonth()]} ${endDate.getDate()}`;
        }

        // PREÇO
        const price = budget.price || budget.totalPrice || 0;
        const numPax = budget.numPax || 2;
        const pricePerPerson = numPax > 0 ? (price / numPax) : price;

        // SLIDER DE IMAGENS
        let sliderHTML = '';
        if (hotelImages.length > 0) {
            sliderHTML = `
                <div class="package-slider">
                    <div class="slider-images">
                        ${hotelImages.map((img, idx) => `
                            <div class="slider-image ${idx === 0 ? 'active' : ''}" style="background-image: url('${img}')"></div>
                        `).join('')}
                    </div>
                    ${hotelImages.length > 1 ? `
                        <button class="slider-btn slider-prev">‹</button>
                        <button class="slider-btn slider-next">›</button>
                        <div class="slider-dots">
                            ${hotelImages.map((_, idx) => `
                                <span class="slider-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // CARD HTML (MESMA ESTRUTURA DOS RESULTADOS)
        return `
            <div class="soltour-package-card" data-budget-id="${budget.budgetId}">
                ${sliderHTML}

                <div class="package-info">
                    <div class="package-header">
                        <div>
                            <span class="package-destination">${city}, ${country}</span>
                            <h3 class="package-name">${hotelName}</h3>
                            <div class="package-rating">
                                ${'⭐'.repeat(hotelStars)}
                            </div>
                        </div>
                    </div>

                    <div class="package-details-grid">
                        <div class="detail-item">
                            <span class="detail-icon">🛫</span>
                            <span class="detail-text">Saída: ${originCity || 'Lisboa'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">🌙</span>
                            <span class="detail-text">${numNights} noites</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">🍽️</span>
                            <span class="detail-text">${mealPlan || 'Regime alimentar'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">📅</span>
                            <span class="detail-text">${seasonWindow || 'Datas da viagem'}</span>
                        </div>
                    </div>

                    <div class="package-room-info" id="details-extra-info">
                        <p style="color: #666; font-size: 14px; margin: 0;">
                            Carregando informações adicionais do hotel...
                        </p>
                    </div>
                </div>

                <div class="package-price">
                    <div class="price-per-person">
                        <span class="price-label-small">desde</span>
                        <span class="price-amount-large">${formatPrice(pricePerPerson)}€</span>
                        <span class="price-label-small">/ pax</span>
                    </div>
                    <div class="price-total">
                        <span class="price-total-label">Preço total</span>
                        <span class="price-total-amount">${formatPrice(price)}€</span>
                    </div>
                    <button class="soltour-btn soltour-btn-primary" id="btn-request-quote"
                            style="padding: 20px 35px !important; border-radius: 100px !important; background: #019CB8 !important; color: #fff !important; border: none !important; font-size: 16px !important; font-weight: 700 !important; width: 100% !important;">
                        Pedir cotação deste pacote
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Inicializa o slider de imagens
     */
    function initializeImageSlider() {
        const $slider = $('.package-slider');
        if ($slider.length === 0) return;

        let currentIndex = 0;
        const $images = $slider.find('.slider-image');
        const $dots = $slider.find('.slider-dot');
        const totalImages = $images.length;

        function goToSlide(index) {
            currentIndex = index;
            $images.removeClass('active').eq(index).addClass('active');
            $dots.removeClass('active').eq(index).addClass('active');
        }

        $slider.find('.slider-next').on('click', function(e) {
            e.stopPropagation();
            goToSlide((currentIndex + 1) % totalImages);
        });

        $slider.find('.slider-prev').on('click', function(e) {
            e.stopPropagation();
            goToSlide((currentIndex - 1 + totalImages) % totalImages);
        });

        $dots.on('click', function(e) {
            e.stopPropagation();
            goToSlide(parseInt($(this).data('index')));
        });
    }

    /**
     * Busca detalhes adicionais do hotel e enriquece a página
     */
    function fetchAndEnrichHotelDetails($container, packageData) {
        console.log('📡 [DETAILS] Buscando detalhes do hotel via AJAX...');
        console.log('📡 [DETAILS] Parâmetros:', {
            availToken: packageData.availToken,
            budgetId: packageData.budgetId,
            hotelCode: packageData.hotelCode,
            providerCode: packageData.providerCode
        });

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
                    console.warn('⚠️ [DETAILS] API retornou erro:', response);
                    $('#details-extra-info').html('<p style="color: #999;">Detalhes adicionais não disponíveis.</p>');
                    return;
                }

                const data = response.data || {};
                const details = data.details || data.hotelDetails || data;

                console.log('📋 [DETAILS] Detalhes parseados:', details);

                // Enriquecer a seção de informações extras
                let extraInfoHTML = '';

                if (details.description || details.longDescription) {
                    extraInfoHTML += `
                        <div style="margin-bottom: 15px;">
                            <strong>Sobre o hotel:</strong>
                            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                                ${(details.longDescription || details.description).substring(0, 200)}...
                            </p>
                        </div>
                    `;
                }

                if (details.facilities && Array.isArray(details.facilities) && details.facilities.length > 0) {
                    extraInfoHTML += `
                        <div style="margin-bottom: 15px;">
                            <strong>Serviços:</strong>
                            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                                ${details.facilities.slice(0, 3).join(', ')}...
                            </p>
                        </div>
                    `;
                }

                if (extraInfoHTML) {
                    $('#details-extra-info').html(extraInfoHTML);
                } else {
                    $('#details-extra-info').html('<p style="color: #999;">Detalhes adicionais não disponíveis.</p>');
                }
            },
            error: function(xhr, status, error) {
                console.error('❌ [DETAILS] Erro AJAX:', error);
                console.error('❌ [DETAILS] Response:', xhr.responseText);
                $('#details-extra-info').html('<p style="color: #999;">Erro ao carregar detalhes.</p>');
            }
        });

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
            console.log('📦 [DETAILS] Dados para cotação:', packageData);

            // Usar o mesmo fluxo da página de resultados
            // Chamar SoltourApp.selectPackage()
            if (window.SoltourApp && window.SoltourApp.selectPackage) {
                console.log('✅ [DETAILS] Chamando SoltourApp.selectPackage()');
                window.SoltourApp.selectPackage(
                    packageData.budgetId,
                    packageData.hotelCode,
                    packageData.providerCode
                );
            } else {
                console.error('❌ [DETAILS] SoltourApp.selectPackage() não encontrado');
                alert('Erro: não foi possível iniciar a cotação. Por favor, tente novamente.');
            }
        });
    }

    /**
     * Formata preço (igual ao soltour-booking.js)
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
