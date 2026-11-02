// @ts-check
import {
  $,
  capitalize,
  createCard,
  fetchJSON,
  hideMessage,
  showMessage,
  toQueryString,
} from "./utils.js";

/** @typedef {import("./utils.js").Zookeeper} Zookeeper */

/** @type {HTMLFormElement} */
const $zookeeperForm = $("#zookeeper-form");
const $displayArea = $("#display-area");

/** @param {Zookeeper[]} resultArr */
const printResults = (resultArr) => {
  const cards = resultArr.map(({ id, name, age, favoriteAnimal }) =>
    createCard(id, name, [
      ["Age", age],
      ["Favorite Animal", capitalize(favoriteAnimal)],
    ]),
  );

  $displayArea.replaceChildren(...cards);
};

/** @param {Record<string, string>} [formData] */
const getZookeepers = async (formData = {}) => {
  try {
    /** @type {Zookeeper[]} */
    const zookeeperArr = await fetchJSON(
      `/api/zookeepers?${toQueryString(formData)}`,
    );
    printResults(zookeeperArr);
    if (zookeeperArr.length === 0) {
      showMessage("No zookeepers match that search.", "info");
    } else {
      hideMessage();
    }
  } catch (err) {
    showMessage(`Error: ${/** @type {Error} */ (err).message}`, "error");
  }
};

/** @param {SubmitEvent} event */
const handleGetZookeepersSubmit = (event) => {
  event.preventDefault();
  /** @type {HTMLInputElement} */
  const nameInput = $('[name="name"]', $zookeeperForm);
  /** @type {HTMLInputElement} */
  const ageInput = $('[name="age"]', $zookeeperForm);

  getZookeepers({ name: nameInput.value.trim(), age: ageInput.value });
};

$zookeeperForm.addEventListener("submit", handleGetZookeepersSubmit);

getZookeepers();
