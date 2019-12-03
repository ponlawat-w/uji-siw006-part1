$(document).ready(() => {
  const $refreshBtn = $('#refresh-btn');
  const $stationList = $('#stations-list');

  const createUrl = (baseUrl, params = {}) =>
    `${baseUrl}?${Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&')}`;

  const distance = (lat1, lng1, lat2, lng2) => Math.sqrt(
    Math.pow(lat1 - lat2, 2) +
    Math.pow(lng1 - lng2, 2)
  );

  const getLocation = () => new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success => {
        resolve({lat: success.coords.latitude, lng: success.coords.longitude});
      }, reject);
    } else {
      reject('Cannot use navigator.geolocation');
    }
  });

  const getWeatherData = (lat = null, lng = null, limit = null) => new Promise((resolve, reject) => {
    const findDistance = lat && lng;

    const requestSuccess = response => {
      if (response.stations) {
        const headers = response.stations.columns.map(x => x.toLowerCase());
        const data = [];

        $.each(response.stations.records, (rowIdx, record) => {
          const station = {};
          $.each(record, (colIdx, cell) => {
            station[headers[colIdx]] = cell;
          });
          if (findDistance) {
            station.distance = distance(lat, lng, parseFloat(station.latitud), parseFloat(station.longitud));
          }
          data.push(station);
        });

        if (findDistance) {
          data.sort((a, b) => a.distance - b.distance);
        }

        if (limit) {
          data.splice(limit);
        }

        resolve(data);
      } else {
        reject('No stations data');
      }
    };

    const requestFailed = response => {
      reject(response);
    };

    const requestUrl = createUrl('http://pixel.uji.es/meteo/api/api.php/stations');

    $.ajax({
      url: requestUrl,
      success: requestSuccess,
      error: requestFailed
    });
  });

  const createListItem = station => $(`<li><a href="#">${station.name}`
    + `<span class="ui-li-count">${Math.round(station.t)}℃</span></a></li>`);

  const populateView = stations => {
    $stationList.find('li').remove();
    $.each(stations, (idx, station) => {
      $stationList.append(createListItem(station));
    });
    $stationList.listview('refresh');
  };

  const refreshHandler = async(e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    try {
      let location = null;
      try {
        location = await getLocation();
      } catch {
        location = null;
      }

      let stations;
      if (location) {
        stations = await getWeatherData(location.lat, location.lng, 30);
      } else {
        stations = await getWeatherData(null, null, 30);
      }
      
      populateView(stations);
    } catch (error) {
      console.error(error);
    }
  };

  $refreshBtn.bind('click', refreshHandler);
});
