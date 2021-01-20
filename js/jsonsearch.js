//==========================
// Author: Mark Bradley (github.com/mtbradley)
//==========================

const json_data_file = "json/data.json";
const images_path = "images";
const min_search_length = 2; // 3 characters as count starts at 0


function sortJsonByProperty(property) {
  return function (a, b) {
    if (a[property] > b[property]) return 1;
    else if (a[property] < b[property]) return -1;

    return 0;
  };
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

const search_bar = document.getElementById("search");

search_bar.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
      search_bar.blur();
  }
});

search_bar.addEventListener("keyup", e => {
  let search_string = e.target.value;
  let t_start = performance.now();
  fetch(json_data_file)
    .then(status)
    .then(json)
    .then(function (data) {
    data.sort(sortJsonByProperty("prod_price_saving"));
    data.reverse();
    search_string = search_string.trim();
    search_string = search_string.replace(/[|&;$%@"<>()\.//\\+,]/g, "");
    let regstr = "";
    let result_count = 0;
    let result_output = "";
    let runtime_output = "";
    let result_count_output = "";

    if (result_count !== 0 || search_string.length > min_search_length) {
      let keywords = search_string.split(" ");
      keywords.forEach(function (keyword) {
        keyword = keyword.trim();
        regstr += `(?=.*${keyword})`;
      });
      let regex = new RegExp(regstr, "gi");
      data.forEach(function (val, key) {
        if (
          val.store_name.search(regex) != -1 ||
          val.prod_name.search(regex) != -1
        ) {
          result_count += 1;
          if (val.fetch_date !== null) {
            let date_str = val.fetch_date;
            let date_pattern = /(\d{4})(\d{2})(\d{2})/;
            let date_mod = new Date(
              date_str.replace(date_pattern, "$1-$2-$3")
            );
            var date_new = date_mod.toString().substring(4, 15);
          }

          result_output += `
          <div class="column is-one-quarter-desktop is-one-third-tablet">
            <div class="card is-shady">
              <div class="card-image mx-2">
                <figure class="image is-1by1">
                  <a href="https://${val.prod_url}" target="_blank"><img src="${images_path}/products/${val.prod_image}" alt="Product Image for ${val.prod_name}" class="modal-button" data-target="modal-image2"></a>
                </figure>
              </div>
              <div class="card-content">
                <div class="content">
                <h4>${result_count}. ${val.prod_name.length > 42 ? (val.prod_name.substring(0, 42) + '...') : val.prod_name}</h4>
                <p>${val.prod_name}. This price was current on ${date_new}.</p>
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
    if (result_count > 0 && search_string.length > min_search_length) {
      document.getElementById("btn-page-top").style.display = "block";
      result_count_output = `${result_count}`;
    } else if (result_count == 0 && search_string.length > 3) {
      result_count_output = "0";
      result_output = "";
      runtime_output = "";
    } else if (result_count == 0 || search_string.length <= min_search_length) {
      document.getElementById("btn-page-top").style.display = "none";
      result_count_output = "_";
      result_output = "";
      runtime_output = "";
    }
    document.querySelector('#pricedata').innerHTML = result_output;
    document.querySelector('#search_results').innerHTML = result_count_output;
    let t_finish = performance.now();
    if (result_count !== 0 && search_string.length > min_search_length) {
      let t_runtime = (t_finish - t_start).toFixed(2);
      runtime_output = `Runtime ${t_runtime} milliseconds`;
    }
    document.querySelector('#runtime').innerHTML = runtime_output;
  })
  .catch(function (error) {
    console.log("Request failed", error);
  });
});

document.addEventListener("DOMContentLoaded", function() {
  fetch(json_data_file)
    .then(status)
    .then(json)
    .then(function (data) {
      let obj_count = Object.keys(data).length;
      let total_output = "";
      if (obj_count) {
        total_output = `${obj_count}`;
      }
      document.querySelector('#total_records').innerHTML = total_output;
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
        event.target.src = `${images_path}/placeholder/product.jpg`;
        event.target.alt = "Image not found.";
      }
  },
  true
);
