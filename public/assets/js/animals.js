const $animalForm = document.querySelector("#animals-form");
const $displayArea = document.querySelector("#display-area");

const printResults = (resultArr) => {
  const cards = resultArr.map(({ id, name, personalityTraits, species, diet }) =>
    createCard(id, name, [
      ["Species", capitalize(species)],
      ["Diet", capitalize(diet)],
      ["Personality Traits", personalityTraits.map(capitalize).join(", ")],
    ])
  );

  $displayArea.replaceChildren(...cards);
};

const getAnimals = async (formData = {}) => {
  try {
    const animalData = await fetchJSON(`/api/animals?${toQueryString(formData)}`);
    printResults(animalData);
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
};

const handleGetAnimalsSubmit = (event) => {
  event.preventDefault();
  const checkedDiet = $animalForm.querySelector('[name="diet"]:checked');
  const diet = checkedDiet ? checkedDiet.value : "";

  const selectedTraits = $animalForm.querySelector('[name="personality"]')
    .selectedOptions;
  const personalityTraits = Array.from(selectedTraits, (option) => option.value).join(",");

  getAnimals({ diet, personalityTraits });
};

$animalForm.addEventListener("submit", handleGetAnimalsSubmit);

getAnimals();
