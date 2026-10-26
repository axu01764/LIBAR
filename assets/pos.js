    const { createApp, ref, computed, watch, onMounted, onBeforeUnmount, nextTick } = Vue;
    const POS_STORAGE_KEY = 'li-bar-pos-tonight-v1';
    const POS_SLOT_MS = 5 * 60 * 1000;
    const POS_UNDO_WINDOW_MS = 3 * 1000;
    const POS_DOUBLE_TAP_MS = 320;
    const POS_SINGLE_CLICK_DECISION_MS = 240;
    const WHEEL_ENABLED = false;
    const MENU_ONLY_MODE = true;
    const GUITAR_LANDING_MODE = true;

    const getServiceDateKey = (timestamp = Date.now()) => {
        const date = new Date(timestamp);
        if (date.getHours() < 14) {
            date.setDate(date.getDate() - 1);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getSlotStart = (timestamp) => Math.floor(timestamp / POS_SLOT_MS) * POS_SLOT_MS;

    const formatClock = (timestamp) => new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(new Date(timestamp));

    const isCoarsePointerDevice = () => window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches;

    const classicDrinksList = [];
    const classicDrinkSectionDefinitions = [];
    const fruitCocktailsList = window.LIBAR_CONTENT.drinks;
    const anniversaryWheelOptions = [
        { key: 'off-3', label: '3元优惠', discount: 3, weight: 70, start: 0, end: 70 },
        { key: 'off-5', label: '5元优惠', discount: 5, weight: 20, start: 70, end: 90 },
        { key: 'off-8', label: '8元优惠', discount: 8, weight: 8, start: 90, end: 98 },
        { key: 'off-10', label: '10元优惠', discount: 10, weight: 2, start: 98, end: 100 }
    ];

    createApp({
        setup() {
            const classicDrinks = ref(classicDrinksList);
            const fruitCocktails = ref(fruitCocktailsList);
            const wheelOptions = ref(anniversaryWheelOptions);
            const wheelRotation = ref(0);
            const isWheelSpinning = ref(false);
            const highlightedWheelOptionKey = ref('');
            const wheelEnabled = ref(WHEEL_ENABLED);
            const menuOnlyMode = ref(MENU_ONLY_MODE);
            const guitarLandingMode = ref(GUITAR_LANDING_MODE);
            const showWheel = ref(false);
            const showPos = ref(false);
            const showRecipePreview = ref(false);
            const recipePreviewTitle = ref('');
            const recipePreviewDrinkId = ref('');
            const recipePreviewSrc = ref('');
            const recipeImageMissing = ref(false);
            const recipeImageCandidates = ref([]);
            const recipeImageCandidateIndex = ref(0);
            const posOrders = ref([]);
            const timelineScroller = ref(null);
            const now = ref(Date.now());
            const activeServiceDate = ref(getServiceDateKey());
            const lastMobileTap = {
                type: '',
                key: '',
                time: 0
            };
            const drinkClickState = {
                key: '',
                time: 0,
                timer: null
            };

            const posDrinkGroups = computed(() => [
                {
                    id: 'fruit',
                    title: `本期酒单 / ${window.LIBAR_CONTENT.event.name}`,
                    drinks: fruitCocktails.value.filter((drink) => !drink.soldOut)
                },
                { id: 'classic', title: '经典 Classics', drinks: classicDrinks.value.filter((drink) => !drink.soldOut) }
            ].filter((group) => group.drinks.length));
            const classicDrinkSections = computed(() => classicDrinkSectionDefinitions.map((section) => ({
                ...section,
                drinks: section.drinkIds
                    .map((drinkId) => classicDrinks.value.find((drink) => drink.id === drinkId))
                    .filter(Boolean)
            })));
            const allPosDrinks = computed(() => posDrinkGroups.value.flatMap((group) => group.drinks));

            const serviceDateLabel = computed(() => activeServiceDate.value.replace(/-/g, '.'));
            const totalDrinkCount = computed(() => posOrders.value.length);

            const getDrinkCount = (drinkId) => posOrders.value.filter((order) => order.drinkId === drinkId).length;
            const isLongPosDrinkName = (name) => String(name || '').replace(/\s+/g, '').length > 5;

            const parseDrinkDesc = (desc) => {
                const lines = String(desc || '').split('\n').map((line) => line.trim());
                const ingredientLines = [];
                let bodyStartIndex = lines.length;

                for (let index = 0; index < lines.length; index += 1) {
                    const line = lines[index];
                    if (!line) {
                        continue;
                    }

                    if (line.includes('/')) {
                        ingredientLines.push(line);
                        continue;
                    }

                    bodyStartIndex = index;
                    break;
                }

                const ingredients = ingredientLines
                    .flatMap((line) => line.split('/'))
                    .map((item) => item.trim())
                    .filter(Boolean);
                const body = lines.slice(bodyStartIndex).filter(Boolean).join('\n');

                return { ingredients, body };
            };

            const getDrinkIngredients = (desc) => parseDrinkDesc(desc).ingredients;
            const getDrinkIngredientLine = (desc) => getDrinkIngredients(desc).join(' / ');
            const getDrinkDescBody = (desc) => parseDrinkDesc(desc).body;

            const pickWheelOption = () => {
                const randomValue = Math.random() * 100;
                return wheelOptions.value.find((option) => randomValue >= option.start && randomValue < option.end) || wheelOptions.value[0];
            };

            const enterWheel = () => {
                if (!wheelEnabled.value) {
                    return;
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
                showWheel.value = true;
            };

            const exitWheel = () => {
                showWheel.value = false;
            };

            const runAnniversaryWheel = () => {
                if (isWheelSpinning.value) {
                    return;
                }

                const selected = pickWheelOption();
                const stopPercent = selected.start + Math.random() * (selected.end - selected.start);
                const targetDegree = stopPercent * 3.6;
                const normalizedCurrent = ((wheelRotation.value % 360) + 360) % 360;
                const destination = (360 - targetDegree) % 360;
                const delta = ((destination - normalizedCurrent) + 360) % 360;
                const extraTurns = 8 * 360;

                isWheelSpinning.value = true;
                highlightedWheelOptionKey.value = '';
                wheelRotation.value += extraTurns + delta;

                window.setTimeout(() => {
                    highlightedWheelOptionKey.value = selected.key;
                    isWheelSpinning.value = false;
                }, 6900);
            };

            const buildRecipeImageCandidates = (drinkId) => {
                const id = String(drinkId || '').trim();
                return [
                    `images/id-${id}.png`,
                    `images/id-${id}png.png`,
                    `images/recipes/id-${id}.png`,
                    `images/recipes/${id}.png`,
                    `id-${id}.png`,
                    `id-${id}png.png`,
                    `recipes/id-${id}.png`,
                    `recipes/${id}.png`
                ];
            };

            const openRecipePreview = (drink) => {
                recipePreviewDrinkId.value = String(drink.id);
                recipePreviewTitle.value = `${drink.name} / ${drink.subName}`;
                recipeImageCandidates.value = buildRecipeImageCandidates(drink.id);
                recipeImageCandidateIndex.value = 0;
                recipePreviewSrc.value = recipeImageCandidates.value[0] || '';
                recipeImageMissing.value = recipeImageCandidates.value.length === 0;
                showRecipePreview.value = true;
            };

            const handleRecipeImageError = () => {
                const nextIndex = recipeImageCandidateIndex.value + 1;
                if (nextIndex < recipeImageCandidates.value.length) {
                    recipeImageCandidateIndex.value = nextIndex;
                    recipePreviewSrc.value = recipeImageCandidates.value[nextIndex];
                    return;
                }
                recipeImageMissing.value = true;
                recipePreviewSrc.value = '';
            };

            const closeRecipePreview = () => {
                showRecipePreview.value = false;
            };

            const drinkButtonStyle = (drink) => {
                if (drink.name === 'Mamba Libre') {
                    return {
                        background: 'linear-gradient(180deg, #7e22ce 0%, #7e22ce 50%, #facc15 50%, #facc15 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundClip: 'padding-box'
                    };
                }

                return {
                    backgroundColor: drink.color,
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                };
            };

            const orderCardStyle = (order) => {
                if (order.done) {
                    return {};
                }

                if (order.name === 'Mamba Libre') {
                    return {
                        background: 'linear-gradient(180deg, #7e22ce 0%, #7e22ce 50%, #facc15 50%, #facc15 100%)',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                        backgroundClip: 'padding-box'
                    };
                }

                return {
                    backgroundColor: order.color,
                    borderColor: 'rgba(255, 255, 255, 0.08)'
                };
            };

            const buildTimelineSlots = () => {
                const sortedOrders = [...posOrders.value].sort((a, b) => a.orderedAt - b.orderedAt);
                const ordersBySlot = new Map();

                sortedOrders.forEach((order) => {
                    const slotStart = getSlotStart(order.orderedAt);
                    if (!ordersBySlot.has(slotStart)) {
                        ordersBySlot.set(slotStart, []);
                    }
                    ordersBySlot.get(slotStart).push(order);
                });

                const currentSlot = getSlotStart(now.value);
                const firstSlot = sortedOrders.length ? getSlotStart(sortedOrders[0].orderedAt) : currentSlot;
                const lastOrderSlot = sortedOrders.length ? getSlotStart(sortedOrders[sortedOrders.length - 1].orderedAt) : currentSlot;
                const lastSlot = Math.max(currentSlot + (POS_SLOT_MS * 5), lastOrderSlot);
                const slots = [];

                for (let slot = firstSlot; slot <= lastSlot; slot += POS_SLOT_MS) {
                    slots.push({
                        start: slot,
                        label: formatClock(slot),
                        orders: ordersBySlot.get(slot) || []
                    });
                }

                return slots;
            };

            const posTimelineSlots = computed(() => buildTimelineSlots());

            const persistTonightData = () => {
                try {
                    window.localStorage.setItem(POS_STORAGE_KEY, JSON.stringify({
                        serviceDate: activeServiceDate.value,
                        orders: posOrders.value
                    }));
                } catch (error) {
                    console.warn('POS storage unavailable', error);
                }
            };

            const loadTonightData = () => {
                try {
                    const raw = window.localStorage.getItem(POS_STORAGE_KEY);
                    const todayKey = getServiceDateKey();

                    if (!raw) {
                        activeServiceDate.value = todayKey;
                        posOrders.value = [];
                        return;
                    }

                    const parsed = JSON.parse(raw);
                    if (parsed && Array.isArray(parsed.orders)) {
                        activeServiceDate.value = parsed.serviceDate || todayKey;
                        posOrders.value = parsed.orders.map((order) => ({
                            ...order,
                            done: Boolean(order.done)
                        }));
                    } else {
                        activeServiceDate.value = todayKey;
                        posOrders.value = [];
                    }
                } catch (error) {
                    activeServiceDate.value = getServiceDateKey();
                    posOrders.value = [];
                }
            };

            const scrollTimelineToEnd = async () => {
                await nextTick();
                if (timelineScroller.value) {
                    timelineScroller.value.scrollLeft = timelineScroller.value.scrollWidth;
                }
            };

            const handleTimelineWheel = (event) => {
                if (!timelineScroller.value) {
                    return;
                }

                event.preventDefault();

                if (event.shiftKey) {
                    const horizontalDelta = event.deltaY || event.deltaX;
                    timelineScroller.value.scrollLeft += horizontalDelta;
                    return;
                }

                timelineScroller.value.scrollTop += event.deltaY;
            };

            const runMobileDoubleTap = (type, key, action) => {
                if (!isCoarsePointerDevice()) {
                    return;
                }

                const tapTime = Date.now();
                const tapKey = String(key);

                if (lastMobileTap.type === type && lastMobileTap.key === tapKey && tapTime - lastMobileTap.time <= POS_DOUBLE_TAP_MS) {
                    lastMobileTap.type = '';
                    lastMobileTap.key = '';
                    lastMobileTap.time = 0;
                    action();
                    return;
                }

                lastMobileTap.type = type;
                lastMobileTap.key = tapKey;
                lastMobileTap.time = tapTime;
            };

            const handleDrinkTap = (drink) => {
                const tapTime = Date.now();
                const tapKey = String(drink.id);
                const isSameDrinkDoubleTap = drinkClickState.key === tapKey && tapTime - drinkClickState.time <= POS_DOUBLE_TAP_MS;

                if (isSameDrinkDoubleTap) {
                    if (drinkClickState.timer) {
                        window.clearTimeout(drinkClickState.timer);
                    }
                    drinkClickState.key = '';
                    drinkClickState.time = 0;
                    drinkClickState.timer = null;
                    toggleOrderDrink(drink);
                    return;
                }

                if (drinkClickState.timer) {
                    window.clearTimeout(drinkClickState.timer);
                    drinkClickState.timer = null;
                }

                drinkClickState.key = tapKey;
                drinkClickState.time = tapTime;
                drinkClickState.timer = window.setTimeout(() => {
                    openRecipePreview(drink);
                    if (drinkClickState.key === tapKey) {
                        drinkClickState.key = '';
                        drinkClickState.time = 0;
                        drinkClickState.timer = null;
                    }
                }, POS_SINGLE_CLICK_DECISION_MS);
            };

            const handleOrderTap = (orderId) => {
                runMobileDoubleTap('order', orderId, () => toggleOrderDone(orderId));
            };

            const enterPos = async () => {
                showWheel.value = false;
                showPos.value = true;
                await scrollTimelineToEnd();
            };

            const exitPos = () => {
                showPos.value = false;
                closeRecipePreview();
            };

            const findLatestOrderIndexByDrink = (drinkId) => {
                for (let index = posOrders.value.length - 1; index >= 0; index -= 1) {
                    if (posOrders.value[index].drinkId === drinkId) {
                        return index;
                    }
                }
                return -1;
            };

            const toggleOrderDrink = (drink) => {
                const orderedAt = Date.now();
                now.value = orderedAt;

                const latestIndex = findLatestOrderIndexByDrink(drink.id);
                if (latestIndex !== -1) {
                    const latestOrder = posOrders.value[latestIndex];
                    if (orderedAt - latestOrder.orderedAt <= POS_UNDO_WINDOW_MS) {
                        posOrders.value.splice(latestIndex, 1);
                        return;
                    }
                }

                posOrders.value.push({
                    id: `order-${drink.id}-${orderedAt}-${Math.random().toString(36).slice(2, 8)}`,
                    drinkId: drink.id,
                    name: drink.name,
                    subName: drink.subName,
                    color: drink.color,
                    orderedAt,
                    done: false
                });
            };

            const toggleOrderDone = (orderId) => {
                const targetOrder = posOrders.value.find((order) => order.id === orderId);
                if (!targetOrder) {
                    return;
                }
                targetOrder.done = !targetOrder.done;
            };

            const clearTonightData = () => {
                if (!window.confirm('确认清空今晚数据吗？')) {
                    return;
                }
                activeServiceDate.value = getServiceDateKey();
                posOrders.value = [];
                now.value = Date.now();
            };

            const exportTonightData = async () => {
                const drinkLines = allPosDrinks.value.map((drink) => `${drink.subName}：${getDrinkCount(drink.id)}杯`);

                const topSlots = [...posTimelineSlots.value]
                    .filter((slot) => slot.orders.length > 0)
                    .sort((a, b) => b.orders.length - a.orders.length || a.start - b.start)
                    .slice(0, 3);

                const slotLines = topSlots.length
                    ? topSlots.map((slot) => `${slot.label}：${slot.orders.length}杯`)
                    : ['暂无订单'];

                const exportText = [
                    `总杯数：${totalDrinkCount.value}`,
                    ...drinkLines,
                    '点单最多的三个时间段：',
                    ...slotLines
                ].join('\n');

                try {
                    await navigator.clipboard.writeText(exportText);
                    window.alert('已复制当晚数据到剪切板');
                } catch (error) {
                    window.alert(`复制失败，请手动复制：\n\n${exportText}`);
                }
            };

            let clockTimer = null;

            onMounted(() => {
                loadTonightData();

                const observerOptions = {
                    root: null,
                    rootMargin: '0px',
                    threshold: 0.15
                };

                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                        } else {
                            if (entry.boundingClientRect.top > 0) {
                                entry.target.classList.remove('is-visible');
                            }
                        }
                    });
                }, observerOptions);

                document.querySelectorAll('.reveal-up, .img-mask').forEach((el) => {
                    observer.observe(el);
                });

                clockTimer = window.setInterval(() => {
                    now.value = Date.now();
                }, 30000);
            });

            onBeforeUnmount(() => {
                if (clockTimer) {
                    window.clearInterval(clockTimer);
                }
                document.body.classList.remove('pos-mode');
                document.body.style.overflow = '';
            });

            watch(posOrders, () => {
                persistTonightData();
            }, { deep: true });

            watch([showPos, showWheel], async ([posVisible, wheelVisible]) => {
                document.body.classList.toggle('pos-mode', posVisible);
                document.body.style.overflow = (posVisible || wheelVisible) ? 'hidden' : '';
                if (posVisible) {
                    await scrollTimelineToEnd();
                }
                if (wheelVisible && posVisible) {
                    showWheel.value = false;
                }
            }, { immediate: true });

            return {
                classicDrinks,
                classicDrinkSections,
                fruitCocktails,
                wheelOptions,
                wheelRotation,
                isWheelSpinning,
                highlightedWheelOptionKey,
                wheelEnabled,
                menuOnlyMode,
                guitarLandingMode,
                showWheel,
                showPos,
                showRecipePreview,
                recipePreviewTitle,
                recipePreviewDrinkId,
                recipePreviewSrc,
                recipeImageMissing,
                posOrders,
                posDrinkGroups,
                serviceDateLabel,
                totalDrinkCount,
                posTimelineSlots,
                timelineScroller,
                enterPos,
                exitPos,
                exportTonightData,
                clearTonightData,
                toggleOrderDrink,
                toggleOrderDone,
                handleDrinkTap,
                handleOrderTap,
                handleTimelineWheel,
                getDrinkCount,
                isLongPosDrinkName,
                getDrinkIngredients,
                getDrinkIngredientLine,
                getDrinkDescBody,
                enterWheel,
                exitWheel,
                runAnniversaryWheel,
                handleRecipeImageError,
                closeRecipePreview,
                drinkButtonStyle,
                orderCardStyle
            };
        }
    }).mount('#app');
