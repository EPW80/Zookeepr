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

/** @typedef {import("./utils.js").Animal} Animal */

/** @type {HTMLFormElement} */
const $animalForm = $("#animals-form");
const $displayArea = $("#display-area");

/** @param {Animal[]} resultArr */
const printResults = (resultArr) => {
  const cards = resultArr.map(
    ({ id, name, personalityTraits, species, diet }) =>
      createCard(id, name, [
        ["Species", capitalize(species)],
        ["Diet", capitalize(diet)],
        ["Personality Traits", personalityTraits.map(capitalize).join(", ")],
      ]),
  );

  $displayArea.replaceChildren(...cards);
};

/** @param {Record<string, string>} [formData] */
const getAnimals = async (formData = {}) => {
  try {
    /** @type {Animal[]} */
    const animalData = await fetchJSON(
      `/api/animals?${toQueryString(formData)}`,
    );
    printResults(animalData);
    if (animalData.length === 0) {
      showMessage("No animals match that search.", "info");
    } else {
      hideMessage();
    }
  } catch (err) {
    showMessage(`Error: ${/** @type {Error} */ (err).message}`, "error");
  }
};

/** @param {SubmitEvent} event */
const handleGetAnimalsSubmit = (event) => {
  event.preventDefault();
  /** @type {HTMLInputElement} */
  const checkedDiet = $('[name="diet"]:checked', $animalForm);
  const diet = checkedDiet.value;

  /** @type {NodeListOf<HTMLInputElement>} */
  const selectedTraits = $animalForm.querySelectorAll(
    '[name="personality"]:checked',
  );
  const personalityTraits = Array.from(
    selectedTraits,
    (option) => option.value,
  ).join(",");

  getAnimals({ diet, personalityTraits });
};

$animalForm.addEventListener("submit", handleGetAnimalsSubmit);

getAnimals();
