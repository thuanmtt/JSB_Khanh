const searchBtn = document.querySelector("#search-btn");
const cityInput = document.querySelector("#city-input");
const weatherContainer = document.querySelector(".weather");

const weatherCodes = {
    0: { desc: "Trời quang", icon: "fa-sun" },
    1: { desc: "Nắng nhẹ", icon: "fa-cloud-sun" },
    2: { desc: "Bán mây", icon: "fa-cloud-sun" },
    3: { desc: "Nhiều mây", icon: "fa-cloud" },
    45: { desc: "Sương mù", icon: "fa-smog" },
    51: { desc: "Mưa phùn", icon: "fa-cloud-rain" },
    61: { desc: "Mưa nhẹ", icon: "fa-cloud-showers-heavy" },
    63: { desc: "Mưa vừa", icon: "fa-cloud-showers-heavy" },
    80: { desc: "Mưa rào", icon: "fa-cloud-rain" },
    95: { desc: "Giông bão", icon: "fa-cloud-bolt" }
};

async function getWeather() {
    const city = cityInput.value.trim();
    if (!city) return;

    weatherContainer.classList.add("loading");

    try {
        // 1. Lấy tọa độ
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=vi&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results) throw new Error("Không tìm thấy thành phố này!");
        const { latitude, longitude, name, country } = geoData.results[0];

        // 2. Lấy thời tiết (Hiện tại + Lịch sử 10 ngày + Dự báo 10 ngày)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&past_days=10&forecast_days=11&timezone=auto`;
        
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        // 3. Cập nhật UI
        updateUI(`${name}, ${country}`, weatherData.current);
        renderForecast(weatherData.daily);
        
        localStorage.setItem("lastCity", name);
    } catch (error) {
        alert(error.message);
    } finally {
        weatherContainer.classList.remove("loading");
    }
}

function updateUI(location, data) {
    document.querySelector("#city-name").innerText = location;
    document.querySelector("#temp").innerText = Math.round(data.temperature_2m) + "°C";
    document.querySelector("#humidity").innerText = data.relative_humidity_2m + "%";
    document.querySelector("#wind").innerText = data.wind_speed_10m + " km/h";
    
    const now = new Date();
    document.querySelector("#date").innerText = now.toLocaleDateString('vi-VN', { 
        weekday: 'long', day: 'numeric', month: 'long' 
    });

    const info = weatherCodes[data.weather_code] || { desc: "Cập nhật...", icon: "fa-cloud" };
    document.querySelector("#description").innerText = info.desc;
    document.querySelector("#w-icon").className = `fa-solid ${info.icon}`;
}

function renderForecast(daily) {
    const forecastList = document.querySelector("#forecast-list");
    forecastList.innerHTML = "";
    const todayStr = new Date().toISOString().split('T')[0];

    daily.time.forEach((date, index) => {
        const isToday = date === todayStr;
        const isHistory = new Date(date) < new Date(todayStr);
        const code = daily.weather_code[index];
        const icon = weatherCodes[code]?.icon || "fa-cloud";
        
        const dateObj = new Date(date);
        const dayName = isToday ? "Hôm nay" : dateObj.toLocaleDateString('vi-VN', { weekday: 'short' });
        const dateNum = dateObj.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });

        const html = `
            <div class="day-card ${isToday ? 'today' : ''} ${isHistory ? 'history' : ''}">
                <div class="date">${dayName}<br>${dateNum}</div>
                <i class="fa-solid ${icon}"></i>
                <div class="temp-max">${Math.round(daily.temperature_2m_max[index])}°</div>
                <div class="temp-min">${Math.round(daily.temperature_2m_min[index])}°</div>
            </div>
        `;
        forecastList.insertAdjacentHTML('beforeend', html);
    });

    // Cuộn mượt đến ngày hiện tại
    setTimeout(() => {
        const todayCard = document.querySelector(".day-card.today");
        if (todayCard) {
            forecastList.scrollTo({
                left: todayCard.offsetLeft - forecastList.offsetWidth / 2 + todayCard.offsetWidth / 2,
                behavior: 'smooth'
            });
        }
    }, 500);
}

searchBtn.addEventListener("click", getWeather);
cityInput.addEventListener("keypress", (e) => { if (e.key === "Enter") getWeather(); });

window.onload = () => {
    const lastCity = localStorage.getItem("lastCity") || "Hanoi";
    cityInput.value = lastCity;
    getWeather();
};
function getAQIStatus(aqi) {
    if (aqi <= 20) return { label: "Tốt", class: "aqi-good" };
    if (aqi <= 40) return { label: "Khá", class: "aqi-fair" };
    if (aqi <= 60) return { label: "Trung bình", class: "aqi-poor" };
    return { label: "Ô nhiễm", class: "aqi-danger" };
}

async function getWeather() {
    const city = cityInput.value.trim();
    if (!city) return;

    weatherContainer.classList.add("loading");

    try {
        // 1. Lấy tọa độ
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=vi&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();
        if (!geoData.results) throw new Error("Không tìm thấy thành phố!");

        const { latitude, longitude, name, country } = geoData.results[0];

        // 2. Gọi đồng thời Weather API và Air Quality API
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&past_days=10&forecast_days=11&timezone=auto`;
        
        const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi`;

        const [weatherRes, airRes] = await Promise.all([
            fetch(weatherUrl),
            fetch(airQualityUrl)
        ]);

        const weatherData = await weatherRes.json();
        const airData = await airRes.json();

        // 3. Cập nhật giao diện
        updateUI(`${name}, ${country}`, weatherData.current, airData.current);
        renderForecast(weatherData.daily);
        checkDisasterAlerts(weatherData.current.weather_code);

    } catch (error) {
        alert(error.message);
    } finally {
        weatherContainer.classList.remove("loading");
    }
}

function updateUI(location, weather, air) {
    document.querySelector("#city-name").innerText = location;
    document.querySelector("#temp").innerText = Math.round(weather.temperature_2m) + "°C";
    document.querySelector("#humidity").innerText = weather.relative_humidity_2m + "%";
    document.querySelector("#wind").innerText = Math.round(weather.wind_speed_10m) + " km/h";

    // Cập nhật AQI
    const aqi = air.european_aqi;
    const aqiInfo = getAQIStatus(aqi);
    const aqiElem = document.querySelector("#aqi-value");
    aqiElem.innerText = aqi;
    aqiElem.className = aqiInfo.class;
    document.querySelector("#aqi-status").innerText = `AQI: ${aqiInfo.label}`;

    // Ngày tháng và Icon
    const now = new Date();
    document.querySelector("#date").innerText = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
    const info = weatherCodes[weather.weather_code] || { desc: "Cập nhật...", icon: "fa-cloud" };
    document.querySelector("#description").innerText = info.desc;
    document.querySelector("#w-icon").className = `fa-solid ${info.icon}`;
}

// Hàm giả lập cảnh báo thiên tai dựa trên mã thời tiết (Open-Meteo free alerts hạn chế theo vùng)
// Chúng ta sẽ kiểm tra các mã thời tiết cực đoan (95: Giông, 65: Mưa rất to...)
function checkDisasterAlerts(code) {
    const alertWrapper = document.querySelector("#alert-wrapper");
    alertWrapper.innerHTML = ""; 

    let alertMsg = "";
    if (code >= 95) alertMsg = "Cảnh báo: Có giông sét nguy hiểm! Hãy ở trong nhà.";
    else if (code === 65 || code === 82) alertMsg = "Cảnh báo: Mưa rất to, nguy cơ ngập lụt cao.";
    
    if (alertMsg) {
        alertWrapper.innerHTML = `
            <div class="alert-box">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>${alertMsg}</span>
            </div>
        `;
    }
}