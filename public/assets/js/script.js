const $animalForm = document.querySelector("#animal-form");
const $zookeeperForm = document.querySelector("#zookeeper-form");

const handleAnimalFormSubmit = async (event) => {
  event.preventDefault();

  // get animal data and organize it
  const name = $animalForm.querySelector('[name="animal-name"]').value;
  const species = $animalForm.querySelector('[name="species"]').value;
  const checkedDiet = $animalForm.querySelector('[name="diet"]:checked');
  const diet = checkedDiet ? checkedDiet.value : "";

  const selectedTraits = $animalForm.querySelector('[name="personality"]')
    .selectedOptions;
  const personalityTraits = Array.from(selectedTraits, (option) => option.value);
  const animalObject = { name, species, diet, personalityTraits };

  try {
    await postJSON("/api/animals", animalObject);
    $animalForm.reset();
    alert("Thank you for adding an animal!");
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
};

const handleZookeeperFormSubmit = async (event) => {
  event.preventDefault();

  // get zookeeper data and organize it
  const name = $zookeeperForm.querySelector('[name="zookeeper-name"]').value;
  // A blank age must stay invalid rather than becoming 0
  const ageValue = $zookeeperForm.querySelector('[name="age"]').value;
  const age = ageValue === "" ? null : Number(ageValue);
  const favoriteAnimal = $zookeeperForm.querySelector(
    '[name="favorite-animal"]'
  ).value;

  const zookeeperObj = { name, age, favoriteAnimal };

  try {
    await postJSON("/api/zookeepers", zookeeperObj);
    $zookeeperForm.reset();
    alert("Thank you for adding a zookeeper!");
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
};

$animalForm.addEventListener("submit", handleAnimalFormSubmit);
$zookeeperForm.addEventListener("submit", handleZookeeperFormSubmit);
