"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  await putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

async function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();
  storyList = await StoryList.getStories();
  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }
  $allStoriesList.show();

  if (!("favorites" in localStorage)) { return };

  const stories = Array.from($allStoriesList[0]['childNodes']);
  let favoriteStories = JSON.parse(localStorage.favorites);
  let favoriteStoriesList = favoriteStories.map(a => { return a.storyId });
  let ownStories = JSON.parse(localStorage.ownStories);
  let ownStoriesList = ownStories.map(a => { return a.storyId });

  console.log(favoriteStoriesList)
  for (const i of stories) {
    const favoriteTag = document.createElement('p');
    // console.log(i.getAttribute('id'));
    if (favoriteStoriesList.includes(i.getAttribute('id'))) {
      favoriteTag.innerText = '★';
      favoriteTag.setAttribute('favorited', true);
    }
    else {
      favoriteTag.innerText = '☆';
      favoriteTag.setAttribute('favorited', false);
    };
    favoriteTag.setAttribute('id', 'favoriteTag');
    favoriteTag.style.display = "inline";
    i.insertBefore(favoriteTag, i.children[2]);
    if (ownStoriesList.includes(i.getAttribute('id'))) {
      const deleteTag = document.createElement('p');
      deleteTag.innerText = '🗑';
      deleteTag.setAttribute('id', 'deleteTag');
      deleteTag.style.display = "inline";

      i.insertBefore(deleteTag, i.children[3]);
    }
  }
  $allStoriesList.on("click", "#favoriteTag", toggleFavorite);
  $allStoriesList.on("click", "#deleteTag", deleteStory);


};

async function toggleFavorite(e) {
  const tag = e.target;
  console.dir(tag);
  const elementId = tag.getAttribute('id');
  const tagParent = tag.parentElement.getAttribute('id');
  let favoriteStories = JSON.parse(localStorage.favorites);
  // let favoriteStoriesList = favoriteStories.map(a => { return a.storyId });
  if (elementId !== 'favoriteTag') { return };
  if (tag.getAttribute('favorited') === 'true') {
    console.log(localStorage.token, 'hit')

    const res = await axios({
      url: `https://hack-or-snooze-v3.herokuapp.com/users/${currentUser.username}/favorites/${tagParent}`,
      method: "DELETE",
      data: { token: localStorage.token }
    })
      // axios.delete(`https://hack-or-snooze-v3.herokuapp.com/users/${currentUser.username}/favorites/${tagParent}`, { token: currentUser.loginToken })
      .then(res => { return res.data })
      .catch(e => { console.dir(e) });
    // console.dir(res);
    if (res.message === 'Favorite Removed!') {
      tag.innerText = '☆';
      tag.setAttribute('favorited', 'false');
      favoriteStories = favoriteStories.filter((a) => { return a.storyId !== tagParent });//
      localStorage.setItem("favorites", JSON.stringify(favoriteStories));
    };
  }
  else if (tag.getAttribute('favorited') === 'false') {
    const res = await axios.post(`https://hack-or-snooze-v3.herokuapp.com/users/${localStorage.username}/favorites/${tagParent}`, { token: localStorage.token })
      .then(res => { return res.data });
    console.log(res);
    if (res.message === 'Favorite Added!') {
      tag.innerText = '★';
      tag.setAttribute('favorited', 'true');
      favoriteStories.push(storyList.stories.find(obj => obj.storyId === tagParent));
      localStorage.setItem("favorites", JSON.stringify(favoriteStories));
    };
  }
  else { console.log('miss'); }
};

async function deleteStory(e) {
  const tag = e.target;
  console.dir(tag);
  const elementId = tag.getAttribute('id');
  const tagParent = tag.parentElement.getAttribute('id');
  let ownStories = JSON.parse(localStorage.ownStories);
  console.log(ownStories)
  // let ownStoriesList = ownStories.map(a => { return a.storyId });
  if (elementId !== 'deleteTag') { return };
  const res = await axios({
    url: `https://hack-or-snooze-v3.herokuapp.com/stories/${tagParent}`,
    method: "DELETE",
    data: { token: localStorage.token }
  })
    .then(res => { console.log(res.data, 'hi'); return res.data; })
    .catch(e => { console.dir(e, 'miss') });
  // console.dir(ownStories)
  ownStories = ownStories.filter((a) => { return a.storyId !== tagParent });//
  localStorage.setItem("ownStories", JSON.stringify(ownStories));
  e.target.parentElement.remove();
};


async function addStory(evt) {
  console.debug("post", evt);
  evt.preventDefault();

  // grab the username and password
  const title = $("#create-story-title").val();
  const url = $("#create-story-url").val();
  let ownStories = JSON.parse(localStorage.ownStories);
  // let ownStoriesList = ownStories.map(a => { return a.storyId });


  // User.login retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.


  try {
    let story = new Story(await storyList.addStory({ author: localStorage.getItem('username'), title, url }).then(res => { return res.story }));

    ownStories.push(story);
    localStorage.setItem("ownStories", JSON.stringify(ownStories));
    console.dir(story, ownStories, localStorage)
    $createStoryForm.trigger("reset");
    hidePageComponents();
    putStoriesOnPage();
  }
  catch (e) { console.dir(e) };
}

$createStoryForm.on("submit", addStory);
