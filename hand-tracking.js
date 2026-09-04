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
let fistStartedAt = 0;
let fistTriggered = false;
let lastHoveredCard = null;
const pointerId = 9876;

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

function beginPinch(x, y) {
    pinching = true;
    pinchStartX = x;
    pinchStartY = y;
    previousY = y;
    movedDistance = 0;
    activeTarget = document.elementFromPoint(x, y);
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
        if (movedDistance < 14) activeTarget.click();
    }
    pinching = false;
    activeTarget = null;
}

function releaseGesture() {
    if (pinching) endPinch(pinchStartX, previousY);
    fistStartedAt = 0;
    fistTriggered = false;
    cursor.classList.remove("is-visible", "is-pinching", "is-fist");
}

function detectSnap(hand, palmWidth, x, y) {
    const now = performance.now();
    const thumb = hand[4];
    const middle = hand[12];
    const middleDistance = Math.hypot(thumb.x - middle.x, thumb.y - middle.y) / palmWidth;

    if (middleDistance < 0.52) {
        snapArmedAt = now;
        return false;
    }

    const snapped = snapArmedAt > 0 && now - snapArmedAt < 700 && middleDistance > 0.64;
    if (!snapped || pinching || now - lastSnapAt < 650) {
        if (snapArmedAt && now - snapArmedAt >= 700) snapArmedAt = 0;
        return false;
    }

    snapArmedAt = 0;
    lastSnapAt = now;
    const card = document.elementFromPoint(x, y)?.closest(".tcg-card") || lastHoveredCard;
    if (!card || !card.isConnected) return false;
    card.click();
    cursor.classList.remove("is-snapping");
    void cursor.offsetWidth;
    cursor.classList.add("is-snapping");
    return true;
}

function goBackInSite() {
    const modal = document.getElementById("cardModal");
    if (modal && !modal.classList.contains("hidden")) {
        document.getElementById("closeModalButton")?.click();
        return;
    }

    const currentPage = document.getElementById("pageStack")?.dataset.page;
    if (currentPage === "catalog") {
        document.querySelector('[data-page-target="opening"]')?.click();
        return;
    }

    if (history.length > 1) history.back();
}

function detectFist(hand, handedness) {
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
        const indexBase = hand[5];
        const pinkyBase = hand[17];
        const indexX = indexBase.x - wrist.x;
        const indexY = indexBase.y - wrist.y;
        const pinkyX = pinkyBase.x - wrist.x;
        const pinkyY = pinkyBase.y - wrist.y;
        const palmNormal = indexX * pinkyY - indexY * pinkyX;
        // MediaPipe handedness assumes a mirrored selfie image; the camera frames are raw.
        const handednessCorrection = handedness === "Left" ? 1 : -1;
        const palmFacesCamera = palmNormal * handednessCorrection > 0;
        if (palmFacesCamera) {
            location.reload();
        } else {
            goBackInSite();
        }
    }
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
            const pinchDistance = Math.hypot(index.x - thumb.x, index.y - thumb.y) / palmWidth;
            const x = (1 - index.x) * window.innerWidth;
            const y = index.y * window.innerHeight;
            const hoveredCard = document.elementFromPoint(x, y)?.closest(".tcg-card");
            if (hoveredCard) lastHoveredCard = hoveredCard;
            let nextPinching = pinching ? pinchDistance < 0.48 : pinchDistance < 0.38;
            const didSnap = detectSnap(hand, palmWidth, x, y);
            const handedness = result.handedness?.[0]?.[0]?.categoryName || "Right";
            const isFist = didSnap ? false : detectFist(hand, handedness);
            if (didSnap) {
                fistStartedAt = 0;
                fistTriggered = false;
                cursor.classList.remove("is-fist");
            }
            if (isFist) nextPinching = false;
            cursor.classList.add("is-visible");
            updateCursor(x, y, nextPinching);
            if (nextPinching && !pinching) beginPinch(x, y);
            else if (nextPinching && pinching) movePinch(x, y);
            else if (!nextPinching && pinching) endPinch(x, y);
        } else {
            releaseGesture();
        }
    }
    animationFrame = requestAnimationFrame(trackFrame);
}

async function startHandControl() {
    button.disabled = true;
    setStatus("손 인식기를 불러오는 중…");
    try {
        if (!landmarker) {
            const { FilesetResolver, HandLandmarker } = await import(MEDIAPIPE_MODULE);
            const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
            landmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: { modelAssetPath: HAND_MODEL, delegate: "GPU" },
                runningMode: "VIDEO",
                numHands: 1,
                minHandDetectionConfidence: 0.55,
                minHandPresenceConfidence: 0.5,
                minTrackingConfidence: 0.5,
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
        button.setAttribute("aria-pressed", "true");
        button.setAttribute("aria-label", "손 모션 끄기");
        setStatus("집어서 잡기 · 스냅으로 뒤집기 · 손바닥 주먹은 새로고침 · 손등 주먹은 뒤로 가기");
        animationFrame = requestAnimationFrame(trackFrame);
    } catch (error) {
        console.error("Hand tracking could not start", error);
        setStatus("손 인식을 시작하지 못했습니다. 카메라 권한과 인터넷 연결을 확인해 주세요.", true);
    } finally {
        button.disabled = false;
    }
}

function stopHandControl() {
    enabled = false;
    cancelAnimationFrame(animationFrame);
    releaseGesture();
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
    video.classList.remove("is-visible");
    button.classList.remove("is-active");
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", "손 모션 켜기");
    setStatus("");
}

button?.addEventListener("click", () => enabled ? stopHandControl() : startHandControl());
window.addEventListener("beforeunload", stopHandControl);
