//==========================
// Author: Mark Bradley (github.com/mtbradley)
//==========================

const JSON_DATA_FILE = "json/data.json";
const IMAGES_PATH= "images/";
const MIN_SEARCH_LENGTH = 2;
const SEARCH_BAR = document.getElementById("search");
const RESULT_COUNTERS_DIV = document.getElementById("result-counters");
const DATA_OUTPUT_DIV = document.getElementById('product-data');
const BUTTON_TOP_DIV = document.getElementById("btn-page-top");
const RUN_TIME_DIV = document.getElementById("runtime");
const TOTAL_RECORD_COUNT = document.getElementById("total-record-count");
const SEARCH_RESULT_COUNT = document.getElementById('search-result-count');
const SALE_RESULT_COUNT = document.getElementById('sale-count');

function sortJsonByProperty(property) {
  return function (a, b) {
    if (a[property] > b[property]) return 1;
    else if (a[property] < b[property]) return -1;

    return 0;
  };
}

function formatDate(dateInput) {
  // Input format YYYYMMDD 20210118 and output result: MONTH DAY YYYY Jan 18 2021
  let datePattern = /(\d{4})(\d{2})(\d{2})/;
  let dateNew = new Date(
    dateInput.replace(datePattern, "$1-$2-$3"));
  dateNew = dateNew.toString().substring(4, 15);
  return dateNew;
}

function status(response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response);
  } else {
    return Promise.reject(new Error(response.statusText));
  }
}

function json(response) {
  return response.json();
}

SEARCH_BAR.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
      SEARCH_BAR.blur();
  }
});

SEARCH_BAR.addEventListener("keyup", e => {
  let searchString = e.target.value;
  let t_start = performance.now();
  fetch(JSON_DATA_FILE)
    .then(status)
    .then(json)
    .then(function (data) {
    data.sort(sortJsonByProperty("prod_price_saving"));
    data.reverse();
    searchString = searchString.trim();
    searchString = searchString.replace(/[|&;$%@"<>()\.//\\+,]/g, "");
    let regExString = "";
    let resultCount = 0;
    let saleCount = 0;
    let resultDataOutput = "";
    let runtimeOutput = "";

    if (resultCount !== 0 || searchString.length > MIN_SEARCH_LENGTH) {
      let keywords = searchString.split(" ");
      keywords.forEach(function (keyword) {
        keyword = keyword.trim();
        regExString += `(?=.*${keyword})`;
      });
      let regex = new RegExp(regExString, "gi");
      data.forEach(function (val, key) {
        if (
          val.store_name.search(regex) != -1 ||
          val.prod_name.search(regex) != -1
        ) {
          resultCount += 1;
          if (val.prod_price_saving !== null) {
            saleCount += 1;
          }
          resultDataOutput += `
          <div class="column is-one-quarter-desktop is-one-third-tablet">
            <div class="card is-shady">
              <div class="card-image mx-2">
                <figure class="image is-1by1">
                  <a href="https://${val.prod_url}" target="_blank"><img src="${IMAGES_PATH}products/${val.prod_image}" alt="Product Image for ${val.prod_name}" class="modal-button" data-target="modal-image2"></a>
                </figure>
              </div>
              <div class="card-content">
                <div class="content">
                <h4>${resultCount}. ${val.prod_name.length > 42 ? (val.prod_name.substring(0, 42) + '...') : val.prod_name}</h4>
                <p>${val.prod_name}. This price was current on ${val.fetch_date !== null ? formatDate(val.fetch_date) : "unknown date"}.</p>
                  <div class="has-text-centered">
                  ${val.prod_price_saving !== null ? `
                  <button class="button is-danger is-medium is-rounded mx-2 my-2">Now $${val.prod_price_now}</button><br />
                    <button class="button is-success is-light is-rounded mx-1 my-1">Save $${val.prod_price_saving}</button>
                    <button class="button is-info is-light is-rounded mx-1 my-1">Was $${val.prod_price_normal}</button>
                  ` : `
                    <button class="button is-info is-medium is-rounded mx-2 my-2">$${val.prod_price_now}</button>
                  `}
                  </div>
                </div>
              </div>
            <footer class="card-footer">
              <p class="card-footer-item"><a href="https://${val.prod_url}" target="_blank" class="button is-fullwidth is-link is-outlined">${val.store_name}</a></p>
            </footer>
          </div>
        </div>
        `;
        }
      });
    }
    if (resultCount > 0 && searchString.length > MIN_SEARCH_LENGTH) {
      BUTTON_TOP_DIV.style.display = "block";
      RESULT_COUNTERS_DIV.style.display = "block";
    } else if (resultCount == 0 && searchString.length > 3) {
      BUTTON_TOP_DIV.style.display = "none";
      RESULT_COUNTERS_DIV.style.display = "none";
      resultDataOutput = "";
      runtimeOutput = "";
    } else if (resultCount == 0 || searchString.length <= MIN_SEARCH_LENGTH) {
      BUTTON_TOP_DIV.style.display = "none";
      RESULT_COUNTERS_DIV.style.display = "none";
      resultDataOutput = "";
      runtimeOutput = "";
    }
    DATA_OUTPUT_DIV.innerHTML = resultDataOutput;
    SEARCH_RESULT_COUNT.innerHTML = resultCount;
    SALE_RESULT_COUNT.innerHTML = saleCount;
    let t_finish = performance.now();
    if (resultCount !== 0 && searchString.length > MIN_SEARCH_LENGTH) {
      let t_runtime = (t_finish - t_start).toFixed(2);
      runtimeOutput = `Runtime ${t_runtime} milliseconds`;
    }
    RUN_TIME_DIV.innerHTML = runtimeOutput;
  })
  .catch(function (error) {
    console.log("There was an error with the JSON data file request.", error);
  });
});

document.addEventListener("DOMContentLoaded", function() {
  fetch(JSON_DATA_FILE)
    .then(status)
    .then(json)
    .then(function (data) {
      let obj_count = Object.keys(data).length;
      let total_output = "";
      if (obj_count) {
        total_output = `${obj_count}`;
      }
      TOTAL_RECORD_COUNT.innerHTML = total_output;
    })
    .catch(function (error) {
      console.log("Request failed", error);
    });
});

// Replace missing product images with placeholder to preserve card layout.
document.addEventListener("error", function (event) {
    if (event.target.tagName.toLowerCase() !== "img") return;
      let alt_text = event.target.alt.toLowerCase();
      let alt_text_keywords = "Product Image";
      if (alt_text.includes(alt_text_keywords.toLowerCase())) {
        event.target.src = `${IMAGES_PATH}placeholder/product.jpg`;
        event.target.alt = "Image not found.";
      }
  },
  true
);
