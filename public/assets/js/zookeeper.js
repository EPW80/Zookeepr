const $zookeeperForm = document.querySelector("#zookeeper-form");
const $displayArea = document.querySelector("#display-area");

const printResults = (resultArr) => {
  const cards = resultArr.map(({ id, name, age, favoriteAnimal }) =>
    createCard(id, name, [
      ["Age", age],
      ["Favorite Animal", capitalize(favoriteAnimal)],
    ])
  );

  $displayArea.replaceChildren(...cards);
};

const getZookeepers = async (formData = {}) => {
  try {
    const zookeeperArr = await fetchJSON(`/api/zookeepers?${toQueryString(formData)}`);
    printResults(zookeeperArr);
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
};

const handleGetZookeepersSubmit = (event) => {
  event.preventDefault();
  const name = $zookeeperForm.querySelector('[name="name"]').value.trim();
  const age = $zookeeperForm.querySelector('[name="age"]').value;

  getZookeepers({ name, age });
};

$zookeeperForm.addEventListener("submit", handleGetZookeepersSubmit);

getZookeepers();
