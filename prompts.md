analyze tbe readme.md and design.md, and create gemini.md to document useful information about the project for you to know on initial load.  one of the key points you should document is that every prompt I write should be stored in a prompts.md file, your outputs that are not a file should be logged to output.md, and every turn you complete that modifies any files should be committed and pushed. This way I can explore alternate threads of conversation in git branches. Include instructions to read prompts.md and outputs.md on each turn so that we can pick up where we left off after a checkout.

now that we have defined the rules of engagement, lets start working on design.md.  i like section 1, but section 2 needs more definition.  What is a lattice and how does it differ from a tree in this context?  How does it help us express these concepts better, and what UX elements become available in a lattice structure that werent available in a tree?  The prototype layout looks like a tree.  Explain how the lattice appears in the UI.

Ok, that is interesting.  So a tree only deals with parent-child relationships, but a lattice includes horizontal relationships.  I wonder if there is a useful left-right concept we could define, similar to up being parent and down being child?  I'm thinking Hebraic<->Hellenistic might be a cool way to define the horizontal direction for this project.

ok, so the UX needs three columns: to the left, the most-related Hebrew concepts.  in the center, the drill-down details to go deeper on the current concept, and and to the right, the Hellenistic related concepts.  the header remains, with the parent topic and current topic.  pressing up immediately takes you to the parent.  pressing left, down, or right cycles through the concepts in that direction, and pressing space navigates you to that concept.
- the main panel still needs an area to describe the current context.  Between the header and navigation areas there should be a panel describing the current context.  Update the design.md
- Did you read gemini.md?  are you forgetting something?
- Better.  Does gemini.md need to be all caps for you to auto-load it?  Also, the context panel was not meant to be a just breadcrumbs and description.  The top title bar functions as breadcrumbs since it shows the Up hierarchical navigation.  if there is room we could add more of the hierarchy there to give more context.  The context panel was meant to be the main body of the card.  This is where we should define the concept, quote the verse, bullet point historical context, etc.  It should maintain glanceability by highlighting words that are most relevant to the topic, but give enough content to trigger talking points about the topic.  Child concepts should also be highlighted.
- Ok, let me give a better example... (redesign request details)

Follow the same operating procedure mentioned in gemini.md - track my prompts in prompts.md and your outputs (that aren't written to a file) in outputs.md.  commit and push on every turn where edits are made.  this will allow me and others to see how the site was built.  add these instructions to claude.md

Now lets make some minor modifications.  First, yes lets make the switch to Atkinson Hyperlegible.  Also, ensure the viewport is 16:9 aspect ratio.  When it is not, display the content in a 16:9 box.  Use the extra space for up/down/left/right/ok buttons for browser access.

You can also update the instruction to read prompts.md and outputs.md to mention this is only necessary at the beginning of a session (the rest of time they will already be in your context).  The browser buttons are too small and dont seem to work.  make them square, fill the remaining space with them, and make them linear: left, right, ok, up, down.

The green highlight on the bottom is too large, highlighting the whole bottom area.  The title bar also has a lot of empty space above the title, leaving no space for the main content.  finally, the arrows are not working as expected.  Left should cycle through the left/hebrew links, right should cycle the the right/greek links, down through drill-down links in the middle.  also add content for the linked pages so I can test the navigation.

left and right arrow need to also cycle through their respective columns.  they are also showing up in rows instead of columns.  the labels at the bottom should be Hebrew, Drill, and Greek and centered under their column, and the columns should be in that order.  also make the font the same as the body everywhere.  change the order of the browser buttons to left, up, ok, down, right to match.  finally, dont try to center the slide, let it start at the top of the viewport.  this leaves more room for the buttons at the bottom.

there is still a gap at the top before the title starts.

That wasn't it.  it maybe inside the header container

still not it.  its about 8 rem of blank space, 25% of the viewport height.  revert the previous changes and look for something else.

ok, that fixed the viewport, but the browser buttons are still cut off at the bottom of the screen.  also, in the nav area, the left column is larger than the other two.

The nav columns still seem to be adjusting to the size of the their contents rather than fixed width.  Lets also draw a vertical line between the columns.  finally the browser buttons are much taller than they need to be.  lets try 2rem.

ok I think I see whats going on.  you are adding the nav-items directly to the nav-grid.  there should be 3 nav-columns inside the nav-grid, and the items should be added to their column.  this will let you position the buttons vertically within the horizontally arranged columns.

Ok next update - that data.json is going to become too large.  Lets switch to one md file per topic, named <topic>.md, with yaml front matter, parents, summary, and article in 4 sections separated by ---.  The category and type fields are not adding value, so the only front matter fields should be title and spectrum.  The summary is the current main content area, and the article 4th section is optional and determines the visibility of the more... button and what should be displaydd when you interact with it by pressing enter before any arrow key.  For links, lets use md format inline to define them, e.g.:
[atone](#atonement 'Hebrew') -> highlighted word atone, points to data/atonement.md, Hebrew nav column
[sin](#man/sin) or [sin](#man/sin 'Drill') -> data/man/sin.md, Drill nav column is default in section 3 (Summary) and 4 (Article).
[perfect](#plato/ideal 'Greek') -> data/plato/ideal.md, Greek nav column
[salvation](#system/salvation 'Parent') -> data/system/salvation.md, displayed in top parent area,
'Parent' title is default in section 2 (Parents).
This prevents duplicate link definition inline and in links arrays (parent links mentioned in Summary or Article do not need to be included in Parent section, and show up first in Parent nav area.  All the existing concepts would belong in the intro folder except for intro itself, which should be in data/intro.md.
We have been talking about a concept having multiple parents but the nav hasn't supported that.  let's fix that now. The top title area should have two rows.  in the top row, a history of the last 6 topics visited, arranged horizontally oldest to most recent, ending with current topic.  The second row is all the parent links.  Pressing up should no longer immediately navigate, but cycle through the single most recent history item, then the parent links, then the rest of history, ok/enter to navigate.

The page just shows Loading... in the title bar and never loads the intro.

ok that is better.  2 issues though: the content area is displaying the links as raw markdown rather than the green highlights we had.  When I navigate to a topic in the recent history list, it should be as if I had backed out to that page, but its showing something like Parent > child > parent.

The links are not highlighted within the main text.  they should also function as links you can click on mouse and touch environments.  clicking a parent in the parents area is still adding that to the history row, even when it is in the recent history.  Any navigation that happens to return to a page in the last six recent history should be treated as a multi-back button and truncate the remaining history rather than adding a new history entry.

The first up arrow is highlighting the current page rather than the previous page in the history area. Also, the parents area should be clickable in touch/mouse contexts, similar to the bottom navigation.

Good.  One issue remains.  It seems to be auto-focusing the first drill-down child, making an enter/ok navigate there rather than showing the more... article.  also, clicking the more... indicator should display the article.

Nav looks good.  now create md files for the remaining topics in data.json and delete data.json.

now lets remove the browser buttons at the bottom.  To support phone/tablets without keyboards, add swipe up/down/left/right gestures to replace the arrow keys.  A tap on any part of the screen that isn't handled by a link or other action should be interpreted as the enter/ok action.  Also, lets make the page load in full-screen mode, or at least make the first interaction of any kind trigger a switch to full screen

if the initial load is into a path other than #intro, the app should create an artificial history containing the shortest path from #intro to the current node.

great, all nav functions seem to work correctly.  Now complete all the intro topics so all the links work.  If any page mentions a topic that isn't linked, add the link.  The categories topic should drill down to the major points of systematic theology.  Reminder: high school vocabulary.  So rename the soteriology folder and topics to "salvation".  other major categories include Bible (bibliology), God (theology), Jesus (christology), baptism, predestination/free will, etc.  create the top-level topic in each of these categories (in their own folder), but just mention the potential drill-downs without actually linking and creating tbem.

ok, the body area sometimes overflows.  Reduce the font size until it fits.  if a 2-column layout allows the content to fit with a larger font size, use that.

The last resort should be a 0.8 rem, 2 column layout.  if the content still overflows, scroll events should still allow the user to see the hidden content, even if that requires me to add awkward scroll events to my ring input device.

Add a link from the top-level intro.md to the categories so most developers aren't interactive

remove the padding around the links in the footer.  the footer is dominating the space on pages with lots odf links like categories.

remove the vertical nav-item padding and margin completely.

set the nav-item line-height to 1.0

remove tbe nav-column gap

Alright, this nav section isnt worth the space it takes.  lets take a different path.  remove the entire nav-grid.  highlight links within the text in 3 colors: Hebrew yellow, Drill green, Greek cyan.  The left, down, and right arrows should cycle through the links with the text, adding a border around the active link.

add the parent link row and up cycle logic back. pages won't necessarily include text about their parents. Also add small navigation hints with arrow icons and color coding in the footer, like <yellow>[left icon] Hebrew</yellow>

read claude.md

Lets add a shortTitle to the front matter in the md files for any that have long titles.  this should show up in the breadcrumbs.  Only add it for long titles, the breadcrumb should fallback to the title when there is no shortTitle.  also notice I manually updated the title in intro.md.  however I am not seeing this change reflected in the browser when I run python -m http.server.

Let's remove the cache from state for now and store it in page-level memory.  I may add it back after development so feel free to leave it in with a feature flag.

The intro's shortTitle should be Intro.  also use the full title for the final breadcrumb - i.e. the current page.

It still seems to be using a cache across page refreshes.

ok, the back link being different colors/directions is confusing.  lets make it always the parent color and up direction.  Also when the back link is one of the parents, it should not show that parent.  finally, the magenta is a bit too bright.  lets make it more of a light purple/lilac.
