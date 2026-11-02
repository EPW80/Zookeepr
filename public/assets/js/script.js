// @ts-check
import { $, postJSON, showMessage } from "./utils.js";

/**
 * @typedef {import("./utils.js").Animal} Animal
 * @typedef {import("./utils.js").Zookeeper} Zookeeper
 */

/** @type {HTMLFormElement} */
const $animalForm = $("#animal-form");
/** @type {HTMLFormElement} */
const $zookeeperForm = $("#zookeeper-form");

/**
 * The value of a named field in a form.
 * @param {HTMLFormElement} form
 * @param {string} name
 */
const fieldValue = (form, name) =>
  /** @type {HTMLInputElement} */ ($(`[name="${name}"]`, form)).value;

/** @param {SubmitEvent} event */
const handleAnimalFormSubmit = async (event) => {
  event.preventDefault();

  // get animal data and organize it
  const name = fieldValue($animalForm, "animal-name");
  const species = fieldValue($animalForm, "species");
  /** @type {HTMLInputElement | null} */
  const checkedDiet = $animalForm.querySelector('[name="diet"]:checked');
  const diet = checkedDiet ? checkedDiet.value : "";

  /** @type {NodeListOf<HTMLInputElement>} */
  const selectedTraits = $animalForm.querySelectorAll(
    '[name="personality"]:checked',
  );
  const personalityTraits = Array.from(
    selectedTraits,
    (option) => option.value,
  );
  const animalObject = { name, species, diet, personalityTraits };

  try {
    /** @type {Animal} */
    const animal = await postJSON("/api/animals", animalObject);
    $animalForm.reset();
    showMessage(`Thank you for adding ${animal.name}!`);
  } catch (err) {
    showMessage(`Error: ${/** @type {Error} */ (err).message}`, "error");
  }
};

/** @param {SubmitEvent} event */
const handleZookeeperFormSubmit = async (event) => {
  event.preventDefault();

  // get zookeeper data and organize it
  const name = fieldValue($zookeeperForm, "zookeeper-name");
  // A blank age must stay invalid rather than becoming 0
  const ageValue = fieldValue($zookeeperForm, "age");
  const age = ageValue === "" ? null : Number(ageValue);
  const favoriteAnimal = fieldValue($zookeeperForm, "favorite-animal");

  const zookeeperObj = { name, age, favoriteAnimal };

  try {
    /** @type {Zookeeper} */
    const zookeeper = await postJSON("/api/zookeepers", zookeeperObj);
    $zookeeperForm.reset();
    showMessage(`Thank you for adding ${zookeeper.name}!`);
  } catch (err) {
    showMessage(`Error: ${/** @type {Error} */ (err).message}`, "error");
  }
};

$animalForm.addEventListener("submit", handleAnimalFormSubmit);
$zookeeperForm.addEventListener("submit", handleZookeeperFormSubmit);
