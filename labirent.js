// --- OYUNUN BEYNİ (JavaScript) - Labirent Versiyonu ---

// Arduino kodumuzdaki UUID'ler (Aynı)
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

// --- HIZ ARTIŞI ---
// Hassasiyeti 5'ten 7'ye çıkardık. (Daha da hız istiyorsan 8 veya 9 yap)
const sensitivity = 7; 

// HTML elemanlarını seçelim
const connectButton = document.getElementById("connectButton");
const statusDisplay = document.getElementById("status");
const ball = document.getElementById("ball");
const gameArea = document.getElementById("game-area");
const goal = document.getElementById("goal");
const walls = document.querySelectorAll(".wall"); // Tüm duvarları seç

const textDecoder = new TextDecoder("utf-8");
connectButton.onclick = connectToDevice;

// Bu fonksiyon CodePen'deki ile AYNI (Bluetooth Bağlantısı)
async function connectToDevice() {
  try {
    statusDisplay.textContent = "Bluetooth cihazı aranıyor...";
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: "Proje deneme UF" }],
      optionalServices: [SERVICE_UUID] 
    });
    statusDisplay.textContent = "Cihaz bulundu. Sunucuya bağlanılıyor...";
    const server = await device.gatt.connect();
    statusDisplay.textContent = "Servis alınıyor...";
    const service = await server.getPrimaryService(SERVICE_UUID);
    statusDisplay.textContent = "Karakteristik alınıyor...";
    const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
    statusDisplay.textContent = "Bildirimler (Notify) başlatılıyor...";
    await characteristic.startNotifications(); 
    characteristic.addEventListener("characteristicvaluechanged", handleNotifications);
    statusDisplay.textContent = "Bağlandı! Labirenti çöz.";
    connectButton.style.display = "none";
  } catch (error) {
    console.error("Hata:", error);
    statusDisplay.textContent = `Hata: ${error.message}`;
  }
}

// Bu fonksiyon CodePen'deki ile AYNI (Veriyi Alma)
function handleNotifications(event) {
  const value = event.target.value;
  const dataString = textDecoder.decode(value); // Örn: "10.52,-5.20"
  const parts = dataString.split(","); 

  if (parts.length >= 2) { 
    const roll = parseFloat(parts[0]);
    const pitch = parseFloat(parts[1]);
    
    statusDisplay.textContent = `Roll: ${roll.toFixed(2)}, Pitch: ${pitch.toFixed(2)}`;
    moveBall(roll, pitch); // Topu hareket ettir
  }
}

// --- BU FONKSİYON TAMAMEN YENİLENDİ (Labirent Mantığı) ---
function moveBall(roll, pitch) {
    // 1. Topun mevcut pozisyonunu al
    // (offsetTop/Left, CSS'in top/left değerlerini okur)
    let currentX = ball.offsetLeft;
    let currentY = ball.offsetTop;

    // 2. YENİ pozisyonu hesapla (HIZ ARTIRILDI)
    let newX = currentX + (pitch * sensitivity); // Pitch X'i kontrol eder
    let newY = currentY + (roll * sensitivity);  // Roll Y'yi kontrol eder

    // 3. Oyun alanı sınırlarını kontrol et
    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX + ball.clientWidth > gameArea.clientWidth) newX = gameArea.clientWidth - ball.clientWidth;
    if (newY + ball.clientHeight > gameArea.clientHeight) newY = gameArea.clientHeight - ball.clientHeight;

    // 4. Duvar Çarpışma Kontrolü
    let isColliding = false;
    for (const wall of walls) {
        // Topun "yeni" pozisyonu bir duvarla çakışıyor mu?
        if (newX < (wall.offsetLeft + wall.clientWidth) &&
            (newX + ball.clientWidth) > wall.offsetLeft &&
            newY < (wall.offsetTop + wall.clientHeight) &&
            (newY + ball.clientHeight) > wall.offsetTop) {
            
            isColliding = true; // ÇARPIŞMA VAR!
            break; 
        }
    }

    // 5. Çarpışma YOKSA topu hareket ettir
    if (!isColliding) {
        ball.style.left = newX + 'px';
        ball.style.top = newY + 'px';
    }

    // 6. Hedefe Ulaşma Kontrolü
    if (newX < (goal.offsetLeft + goal.clientWidth) &&
        (newX + ball.clientWidth) > goal.offsetLeft &&
        newY < (goal.offsetTop + goal.clientHeight) &&
        (newY + ball.clientHeight) > goal.offsetTop) {
        
        statusDisplay.textContent = "TEBRİKLER! KAZANDIN!";
        // Topu başlangıca geri at
        ball.style.left = '20px';
        ball.style.top = '20px';
    }
}