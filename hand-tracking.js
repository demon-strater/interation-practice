const MEDIAPIPE_MODULE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/+esm";
const MEDIAPIPE_WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const button = document.getElementById("handControlButton");
const status = document.getElementById("handStatus");
const video = document.getElementById("handCamera");
const cursor = document.getElementById("handCursor");

let landmarker = null;
let stream = null;
let animationFrame = 0;
let enabled = false;
let pinching = false;
let activeTarget = null;
let pinchStartX = 0;
let pinchStartY = 0;
let previousY = 0;
let movedDistance = 0;
let lastVideoTime = -1;
let snapArmedAt = 0;
let lastSnapAt = 0;
let snapTarget = null;
let snapStartX = 0;
let snapStartY = 0;
let fistStartedAt = 0;
let fistTriggered = false;
let openPalmSamples = [];
let lastPalmSwipeAt = 0;
const pointerId = 9876;
const PAGE_ORDER = ["opening", "catalog", "about"];
const DRAG_START_PX = 24;
const PINCH_START_DISTANCE = 0.48;
const PINCH_RELEASE_DISTANCE = 0.56;

function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
    status.classList.toggle("is-visible", Boolean(message));
}

function dispatchPointer(target, type, x, y) {
    target?.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId,
        pointerType: "touch",
        isPrimary: true,
        clientX: x,
        clientY: y,
        button: type === "pointermove" ? -1 : 0,
        buttons: type === "pointerup" ? 0 : 1,
    }));
}

function updateCursor(x, y, isPinching) {
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    cursor.classList.toggle("is-pinching", isPinching);
}

function findInteractiveTarget(x, y) {
    const selector = ".tcg-card, .booster-pack, button, [role='button'], a, input, select";
    const offsets = [[0, 0], [-18, 0], [18, 0], [0, -18], [0, 18]];
    for (const [offsetX, offsetY] of offsets) {
        const target = document.elementFromPoint(x + offsetX, y + offsetY)?.closest(selector);
        if (target) return target;
    }
    return null;
}

function beginPinch(x, y, targetOverride = null) {
    pinching = true;
    pinchStartX = x;
    pinchStartY = y;
    previousY = y;
    movedDistance = 0;
    activeTarget = targetOverride || document.elementFromPoint(x, y);
    const interactive = activeTarget?.closest(".tcg-card, .booster-pack, button, [role='button'], a, input, select");
    activeTarget = interactive || null;
    if (activeTarget) {
        dispatchPointer(activeTarget, "pointerdown", x, y);
        activeTarget.classList.add("is-hand-held");
    }
}

function movePinch(x, y) {
    const dx = x - pinchStartX;
    const dy = y - pinchStartY;
    movedDistance = Math.max(movedDistance, Math.hypot(dx, dy));
    if (activeTarget) {
        dispatchPointer(activeTarget, "pointermove", x, y);
    } else {
        window.scrollBy({ top: (previousY - y) * 1.8, behavior: "auto" });
    }
    previousY = y;
}

function endPinch(x, y) {
    if (activeTarget) {
        dispatchPointer(activeTarget, "pointerup", x, y);
        activeTarget.classList.remove("is-hand-held");
    }
    pinching = false;
    activeTarget = null;
}

function releaseGesture() {
    if (pinching) endPinch(pinchStartX, previousY);
    fistStartedAt = 0;
    fistTriggered = false;
    snapArmedAt = 0;
    snapTarget = null;
    snapStartX = 0;
    snapStartY = 0;
    openPalmSamples = [];
    cursor.classList.remove("is-visible", "is-pinching", "is-fist");
}

function updateIndexGesture(hand, palmWidth, x, y, isFist) {
    const now = performance.now();
    const thumb = hand[4];
    const index = hand[8];
    const indexDistance = Math.hypot(thumb.x - index.x, thumb.y - index.y) / palmWidth;
    // Once a gesture starts, keep it alive across small landmark fluctuations.
    const gestureStarted = snapArmedAt > 0 || pinching;
    const fingersTogether = indexDistance < (gestureStarted ? PINCH_RELEASE_DISTANCE : PINCH_START_DISTANCE);

    if (isFist) {
        if (pinching) endPinch(x, y);
        snapArmedAt = 0;
        snapTarget = null;
        snapStartX = 0;
        snapStartY = 0;
        return { isActive: false, didClick: false };
    }

    if (fingersTogether) {
        if (!snapArmedAt) {
            snapArmedAt = now;
            snapStartX = x;
            snapStartY = y;
            snapTarget = findInteractiveTarget(x, y);
            beginPinch(x, y, snapTarget);
        }
        const travel = Math.hypot(x - snapStartX, y - snapStartY);
        if (pinching && travel >= DRAG_START_PX) {
            movePinch(x, y);
        }
        return { isActive: true, didClick: false };
    }

    const heldFor = snapArmedAt ? now - snapArmedAt : 0;
    const didDrag = movedDistance >= DRAG_START_PX;
    if (pinching) endPinch(x, y);
    const target = snapTarget;
    snapArmedAt = 0;
    snapTarget = null;
    snapStartX = 0;
    snapStartY = 0;
    const shouldClick = !didDrag && heldFor > 0 &&
        now - lastSnapAt >= 180 && target?.isConnected;
    if (shouldClick) {
        lastSnapAt = now;
        target.click();
        cursor.classList.remove("is-snapping");
        void cursor.offsetWidth;
        cursor.classList.add("is-snapping");
    }
    return { isActive: false, didClick: Boolean(shouldClick) };
}

function completePendingClick() {
    const target = snapTarget;
    const now = performance.now();
    const shouldClick = snapArmedAt > 0 && movedDistance < DRAG_START_PX &&
        target?.isConnected && now - lastSnapAt >= 180;
    if (shouldClick) {
        lastSnapAt = now;
        target.click();
        cursor.classList.remove("is-snapping");
        void cursor.offsetWidth;
        cursor.classList.add("is-snapping");
    }
    return Boolean(shouldClick);
}

function goBackInSite() {
    const modal = document.getElementById("cardModal");
    if (modal && !modal.classList.contains("hidden")) {
        document.getElementById("closeModalButton")?.click();
        return;
    }

    const currentPage = document.getElementById("pageStack")?.dataset.page || PAGE_ORDER[0];
    const currentIndex = PAGE_ORDER.indexOf(currentPage);
    const previousPage = PAGE_ORDER[currentIndex - 1];
    if (previousPage) {
        document.querySelector(`[data-page-target="${previousPage}"]`)?.click();
        return;
    }

    if (history.length > 1) history.back();
}

function detectFist(hand) {
    const now = performance.now();
    const wrist = hand[0];
    const fingerPairs = [[8, 6], [12, 10], [16, 14], [20, 18]];
    const curledFingers = fingerPairs.filter(([tipIndex, jointIndex]) => {
        const tip = hand[tipIndex];
        const joint = hand[jointIndex];
        return Math.hypot(tip.x - wrist.x, tip.y - wrist.y) < Math.hypot(joint.x - wrist.x, joint.y - wrist.y) * 1.06;
    }).length;
    const isFist = curledFingers >= 4;

    if (!isFist) {
        fistStartedAt = 0;
        fistTriggered = false;
        cursor.classList.remove("is-fist");
        return false;
    }

    cursor.classList.add("is-fist");
    if (!fistStartedAt) fistStartedAt = now;
    if (!fistTriggered && !pinching && now - fistStartedAt >= 480) {
        fistTriggered = true;
        goBackInSite();
    }
    return true;
}

function detectOpenPalmSwipe(hand, isFist, isPinching) {
    const now = performance.now();
    const wrist = hand[0];
    const extendedFingers = [[8, 6], [12, 10], [16, 14], [20, 18]].filter(([tipIndex, jointIndex]) => {
        const tip = hand[tipIndex];
        const joint = hand[jointIndex];
        const tipDistance = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
        const jointDistance = Math.hypot(joint.x - wrist.x, joint.y - wrist.y);
        return tipDistance > jointDistance * 1.04 && tip.y < joint.y + 0.035;
    }).length;
    const palmSpread = Math.hypot(hand[5].x - hand[17].x, hand[5].y - hand[17].y);
    const isOpenPalm = extendedFingers >= 3 && palmSpread > 0.075 && !isFist && !isPinching;

    if (!isOpenPalm) {
        openPalmSamples = [];
        return false;
    }

    // Mirror MediaPipe's camera coordinate so movement matches what users see.
    const palmX = 1 - hand[9].x;
    const palmY = hand[9].y;
    openPalmSamples.push({ x: palmX, y: palmY, time: now });
    openPalmSamples = openPalmSamples.filter((sample) => now - sample.time <= 850).slice(-18);
    if (openPalmSamples.length < 5 || now - lastPalmSwipeAt < 850) return false;

    const first = openPalmSamples[0];
    const last = openPalmSamples[openPalmSamples.length - 1];
    const elapsed = last.time - first.time;
    const deltaX = last.x - first.x;
    const deltaY = last.y - first.y;
    const horizontalTravel = openPalmSamples.slice(1).reduce((sum, sample, index) => {
        return sum + Math.abs(sample.x - openPalmSamples[index].x);
    }, 0);
    const directionConsistency = horizontalTravel ? Math.abs(deltaX) / horizontalTravel : 0;
    const isDeliberateSwipe = elapsed >= 140 && Math.abs(deltaX) >= 0.105 &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.45 && directionConsistency >= 0.62;
    if (!isDeliberateSwipe) return false;

    const currentPage = document.getElementById("pageStack")?.dataset.page || PAGE_ORDER[0];
    const currentIndex = PAGE_ORDER.indexOf(currentPage);
    // Left hand movement advances to the section on the right; right goes back.
    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    const targetPage = PAGE_ORDER[nextIndex];
    openPalmSamples = [];
    lastPalmSwipeAt = now;
    if (!targetPage) return false;

    document.querySelector(`[data-page-target="${targetPage}"]`)?.click();
    return true;
}

function trackFrame() {
    if (!enabled) return;
    if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const result = landmarker.detectForVideo(video, performance.now());
        const hand = result.landmarks?.[0];
        if (hand) {
            const index = hand[8];
            const thumb = hand[4];
            const palmWidth = Math.hypot(hand[5].x - hand[17].x, hand[5].y - hand[17].y) || 0.12;
            const indexPinchDistance = Math.hypot(index.x - thumb.x, index.y - thumb.y) / palmWidth;
            // The pinch point is more stable and intuitive than either fingertip alone.
            const pinchX = (index.x + thumb.x) / 2;
            const pinchY = (index.y + thumb.y) / 2;
            const x = (1 - pinchX) * window.innerWidth;
            const y = pinchY * window.innerHeight;
            // A pinch often curls the other fingers and can resemble a fist. Give the
            // index gesture priority while the thumb and index are near each other.
            const isIndexGesturePose = indexPinchDistance < 0.72 || snapArmedAt > 0 || pinching;
            const isFist = isIndexGesturePose ? false : detectFist(hand);
            const indexGesture = updateIndexGesture(hand, palmWidth, x, y, isFist);
            if (indexGesture.didClick) {
                fistStartedAt = 0;
                fistTriggered = false;
                cursor.classList.remove("is-fist");
            }
            detectOpenPalmSwipe(hand, isFist, indexGesture.isActive);
            cursor.classList.add("is-visible");
            updateCursor(x, y, pinching);
        } else {
            completePendingClick();
            releaseGesture();
        }
    }
    animationFrame = requestAnimationFrame(trackFrame);
}

async function startHandControl() {
    if (enabled || button.disabled) return;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    document.getElementById("handControlState").textContent = "연결하는 중…";
    setStatus("손 인식기를 불러오는 중…");
    try {
        if (!landmarker) {
            const { FilesetResolver, HandLandmarker } = await import(MEDIAPIPE_MODULE);
            const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
            landmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: { modelAssetPath: HAND_MODEL, delegate: "GPU" },
                runningMode: "VIDEO",
                numHands: 1,
                minHandDetectionConfidence: 0.45,
                minHandPresenceConfidence: 0.42,
                minTrackingConfidence: 0.42,
            });
        }
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
        });
        video.srcObject = stream;
        await video.play();
        video.classList.add("is-visible");
        enabled = true;
        button.classList.add("is-active");
        const label = button.querySelector(".hand-control-label");
        if (label) label.textContent = "Hand On";
        document.getElementById("handControlState").textContent = "손 인식 활성화";
        button.setAttribute("aria-pressed", "true");
        button.setAttribute("aria-label", "카메라 끄기");
        setStatus("검지+엄지를 짧게 모으면 클릭 · 길게 모은 채 움직이면 드래그 · 주먹을 쥐면 뒤로 가기");
        animationFrame = requestAnimationFrame(trackFrame);
    } catch (error) {
        console.error("Hand tracking could not start", error);
        stopHandControl();
        setStatus("손 인식을 시작하지 못했습니다. 카메라 권한과 인터넷 연결을 확인해 주세요.", true);
    } finally {
        button.disabled = false;
        button.removeAttribute("aria-busy");
    }
}

function stopHandControl() {
    enabled = false;
    cancelAnimationFrame(animationFrame);
    releaseGesture();
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    lastVideoTime = -1;
    video.srcObject = null;
    video.classList.remove("is-visible");
    button.classList.remove("is-active");
    const label = button.querySelector(".hand-control-label");
    if (label) label.textContent = "Hand";
    document.getElementById("handControlState").textContent = "손으로 조작하기";
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", "카메라 켜기");
    setStatus("");
}

button?.addEventListener("click", () => {
    if (enabled) stopHandControl();
    else startHandControl();
});
window.addEventListener("beforeunload", stopHandControl);
