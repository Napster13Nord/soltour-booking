/**
 * Página de Detalhes do Pacote - BeautyTravel
 * Renderiza detalhes completos do hotel/pacote
 */

(function($) {
    'use strict';

    /**
     * Inicializa a página de detalhes
     */
    function initPackageDetailsPage() {
        const $container = $('#soltour-package-details-page');
        if ($container.length === 0) return;

        // 1. Buscar dados base do sessionStorage
        const stored = sessionStorage.getItem('soltour_selected_package_details');

        if (!stored) {
            // Tentar pegar budgetId da URL como fallback
            const urlParams = new URLSearchParams(window.location.search);
            const budgetId = urlParams.get('budget');

            if (budgetId) {
                // Tentar recuperar da lista de pacotes
                const resultsData = sessionStorage.getItem('soltour_search_results');
                if (resultsData) {
                    try {
                        const data = JSON.parse(resultsData);
                        const packageData = findPackageInResults(data, budgetId);

                        if (packageData) {
                            renderPackageDetails($container, packageData);
                            return;
                        }
                    } catch (e) {
                        console.error('Erro ao recuperar dados dos resultados:', e);
                    }
                }
            }

            // Se chegou aqui, não há dados disponíveis
            $container.html(`
                <div class="bt-quote-error">
                    <h3>Pacote não encontrado</h3>
                    <p>Por favor, volte à página de resultados e selecione um pacote novamente.</p>
                    <button class="bt-back-button" onclick="window.history.back()">
                        ← Voltar aos resultados
                    </button>
                </div>
            `);
            return;
        }

        // 2. Parse dos dados
        let packageData;
        try {
            packageData = JSON.parse(stored);
        } catch (e) {
            $container.html(`
                <div class="bt-quote-error">
                    <h3>Erro ao carregar os dados</h3>
                    <p>Os dados do pacote estão corrompidos. Volte aos resultados e tente novamente.</p>
                    <button class="bt-back-button" onclick="window.history.back()">
                        ← Voltar aos resultados
                    </button>
                </div>
            `);
            return;
        }

        // 3. Renderizar página
        renderPackageDetails($container, packageData);
    }

    /**
     * Tenta encontrar um pacote nos resultados salvos
     */
    function findPackageInResults(resultsData, budgetId) {
        if (!resultsData || !resultsData.allUniqueHotels) return null;

        const packageFound = resultsData.allUniqueHotels.find(pkg =>
            pkg.budget && pkg.budget.budgetId === budgetId
        );

        if (!packageFound) return null;

        // Montar objeto no formato esperado
        return {
            budgetId: budgetId,
            hotelCode: packageFound.hotelCode || '',
            providerCode: packageFound.providerCode || '',
            availToken: resultsData.availToken || '',
            budget: packageFound.budget || {},
            hotelInfo: resultsData.hotelsFromAvailability ?
                resultsData.hotelsFromAvailability[packageFound.hotelCode] : null,
            flightData: resultsData.flightsFromAvailability ?
                Object.values(resultsData.flightsFromAvailability)[0] : null,
            selectedRooms: [],
            selectedRoom: null,
            numRoomsSearched: resultsData.numRoomsSearched || 1,
            searchParams: resultsData.searchParams || {}
        };
    }

    /**
     * Renderiza os detalhes do pacote
     */
    function renderPackageDetails($container, packageData) {
        // 1. Renderizar layout base com dados do availability
        renderBaseLayout($container, packageData);

        // 2. Chamar AJAX para /booking/details
        fetchPackageDetails($container, packageData);
    }

    /**
     * Renderiza o layout base com informações já disponíveis
     */
    function renderBaseLayout($container, packageData) {
        const budget = packageData.budget || {};
        const hotelInfo = packageData.hotelInfo || {};
        const flightData = packageData.flightData || null;
        const searchParams = packageData.searchParams || {};

        const hotelName = hotelInfo.name || budget.hotelName || 'Hotel';
        const hotelStars = hotelInfo.category || hotelInfo.stars || 0;
        const mealPlan = budget.mealPlan || '';
        const numNights = budget.numNights || searchParams.numNights || '';

        // Imagem principal (primeira do slider)
        let heroImage = '';
        if (hotelInfo.images && hotelInfo.images.length > 0) {
            heroImage = hotelInfo.images[0].url || '';
        }

        const starsHTML = hotelStars > 0
            ? '<span class="bt-stars">' + '⭐'.repeat(hotelStars) + '</span>'
            : '';

        // Preço formatado
        const totalPrice = budget.price || budget.totalPrice || 0;
        const formattedPrice = window.formatPrice ? window.formatPrice(totalPrice, 0) : totalPrice.toFixed(0);

        // Datas da viagem
        const startDate = searchParams.startDate || budget.startDate || '';
        const endDate = searchParams.endDate || budget.endDate || '';
        const datesText = startDate && endDate ?
            `${formatDate(startDate)} - ${formatDate(endDate)}` :
            (numNights ? numNights + ' noites' : '');

        $container.html(`
            <!-- Botão Voltar -->
            <button class="bt-back-button" onclick="window.history.back()">
                ← Voltar aos resultados
            </button>

            <div class="bt-package-details-header">
                <div class="bt-package-hero">
                    ${heroImage ? `<img src="${heroImage}" alt="${hotelName}" />` : ''}
                    <div class="bt-package-hero-overlay"></div>
                    <div class="bt-package-hero-info">
                        <h1>${hotelName} ${starsHTML}</h1>
                        ${datesText ? `<p>${datesText}${mealPlan ? ' · ' + mealPlan : ''}</p>` : ''}
                    </div>
                </div>
            </div>

            <div class="bt-package-details-content">
                <div class="bt-package-main">
                    <section class="bt-section bt-hotel-description">
                        <h2>Sobre o hotel</h2>
                        <div class="bt-hotel-description-body">
                            <p style="color: #999;">Carregando descrição completa do hotel...</p>
                        </div>
                    </section>

                    <section class="bt-section bt-hotel-services">
                        <h2>Serviços & Comodidades</h2>
                        <div class="bt-hotel-services-body">
                            <p style="color: #999;">Carregando serviços do hotel...</p>
                        </div>
                    </section>

                    <section class="bt-section bt-hotel-location">
                        <h2>Localização</h2>
                        <div class="bt-hotel-location-body">
                            <p style="color: #999;">Carregando localização...</p>
                        </div>
                    </section>
                </div>

                <aside class="bt-package-sidebar">
                    <div class="bt-price-card">
                        <h3>Resumo do pacote</h3>
                        <p><strong>${formattedPrice}€</strong> / Total</p>
                        ${datesText ? `<p style="margin-bottom: 20px;">${datesText}</p>` : ''}
                        <button class="soltour-btn soltour-btn-primary bt-go-to-quote">
                            Pedir cotação deste pacote
                        </button>
                    </div>
                </aside>
            </div>
        `);

        // Adicionar evento ao botão de cotação
        $container.find('.bt-go-to-quote').on('click', function() {
            // Redirecionar para cotação usando o mesmo fluxo existente
            // Guardar dados necessários no sessionStorage
            const quoteData = {
                budgetId: packageData.budgetId,
                hotelCode: packageData.hotelCode,
                providerCode: packageData.providerCode,
                availToken: packageData.availToken,
                budget: packageData.budget,
                hotelInfo: packageData.hotelInfo,
                flightData: packageData.flightData,
                selectedRooms: packageData.selectedRooms,
                numRoomsSearched: packageData.numRoomsSearched,
                searchParams: packageData.searchParams
            };

            sessionStorage.setItem('soltour_selected_package', JSON.stringify(quoteData));

            // Redirecionar para página de cotação
            window.location.href = '/cotacao/?budget=' + encodeURIComponent(packageData.budgetId);
        });
    }

    /**
     * Busca detalhes adicionais do hotel via AJAX
     */
    function fetchPackageDetails($container, packageData) {
        if (!packageData.availToken || !packageData.budgetId || !packageData.hotelCode || !packageData.providerCode) {
            console.warn('Dados incompletos para buscar detalhes do hotel');
            return;
        }

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
                if (!response.success) {
                    console.warn('Erro ao buscar detalhes:', response);
                    // Manter mensagens genéricas se falhar
                    return;
                }

                const data = response.data || {};
                const details = data.details || data.hotelDetails || data;

                // Atualizar descrição longa
                if (details.description || details.longDescription) {
                    const description = details.longDescription || details.description;
                    $container.find('.bt-hotel-description-body').html(`
                        <p>${description}</p>
                    `);
                } else {
                    $container.find('.bt-hotel-description-body').html(`
                        <p>Descrição não disponível no momento.</p>
                    `);
                }

                // Atualizar serviços/comodidades
                if (details.facilities && Array.isArray(details.facilities) && details.facilities.length > 0) {
                    const items = details.facilities.map(f => `<li>${f}</li>`).join('');
                    $container.find('.bt-hotel-services-body').html(`
                        <ul class="bt-facilities-list">${items}</ul>
                    `);
                } else if (details.services && Array.isArray(details.services) && details.services.length > 0) {
                    const items = details.services.map(s => `<li>${s}</li>`).join('');
                    $container.find('.bt-hotel-services-body').html(`
                        <ul class="bt-facilities-list">${items}</ul>
                    `);
                } else {
                    $container.find('.bt-hotel-services-body').html(`
                        <p>Serviços não disponíveis no momento.</p>
                    `);
                }

                // Atualizar localização
                const addressParts = [];
                if (details.address) addressParts.push(details.address);
                if (details.postalCode && details.city) {
                    addressParts.push(`${details.postalCode} ${details.city}`);
                } else if (details.city) {
                    addressParts.push(details.city);
                }
                if (details.country) addressParts.push(details.country);

                if (addressParts.length > 0) {
                    const locationHTML = addressParts.map(part => `<p>${part}</p>`).join('');
                    $container.find('.bt-hotel-location-body').html(locationHTML);
                } else {
                    $container.find('.bt-hotel-location-body').html(`
                        <p>Localização não disponível no momento.</p>
                    `);
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro AJAX ao buscar detalhes:', error);
                // Manter mensagens genéricas se houver erro
            }
        });
    }

    /**
     * Formata data DD/MM/YYYY
     */
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // Inicializar quando o DOM estiver pronto
    $(document).ready(function() {
        initPackageDetailsPage();
    });

})(jQuery);
