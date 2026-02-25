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

ok, lets go a bit more saturated on that purple color.  it almost looks white.  also, lets rearrange the navigation with the major categories being the root of the site for the purposes of the breadcrumbs.  this page should not be included in the breadcrumbs though, and should contain a link to intro.  Initial navigation should still take you to #intro, and the link to categories should now be a parent link from intro.

move intro.md into intro folder.  move intro/categories.md out to data folder and rename i5 to TOC.md.  update all the links.

when I navigate to the top-level categories, I see Intro > God instead of just God in the breadcrumbs.

add Introduction - What is Systematic Theology? and link to intro to the TOC.  Also add an entry for Holy Spirit, Mankind, and the Church, as well as a topic for "Other Systems".  Then, lets go into a bit more depth on the intro pages, adding "more..." depth to pages that need it, and more pages where there are additional topics.  in particular, lets add more pages on the Hebrew side, showing how Jews approach theology as a relationship, as an active process, as a continual struggle with the text rather than a search for perfect understanding.

the hebrew <-> greek slider isnt adding value.  lets remove it, as well as the values from the md file headers.  also, there is a dashed line and a solid line at the bottom of each page, lets remove the dashed line.  that just leaves the [more...] button on the bottom row.  let's make the [enter] Go reminder in the bottom legend dynamic so it can move there.  it should be orange, and when you first navigate to a page with more... data, should say more...  If there is not it should be empty.  once you start scrolling links, it should change to <enter> Go.  when you reach the end of a link cycle, it should cycle back to no selection to let you go to the more... page.  also, the back link should have a left arrow, not up.

can you prevent the browser from caching app.js?
put the more.../go indicator in the footer where Go was.
more... should have the <enter> symbol before it along with Go.
there should be an empty spot for the more indicator when it is not visible.  it's jarring to see the footer change from 4 to 5 columns.
read claude.md and follow it.  then read all .md files in the data folder and give me a list of those that are redundant and could be combined.  I will review and tell you whether to proceed or not.
The footer is still shifting as the last value changes from blank to more... to go.  Make sure each cell is exactly 20% width.  Also, let's reclaim just a bit more space for the body by putting the breadcrumbs and the back/parent links on the same row, with the back/parent links right justified and the breadcrumbs left justified.
Both Hebrew and Greek agree that God is personal.  He is not a what, He is a Who. Please update the pronouns referring to God, and add this to CLAUDE.md.  also, please update CLAUDE.md to reflect recent removal of the hebrew/greek slider and other recent changes.
Use # instead of ** for headings in md files.  The ** is getting misinterpreted as *<bold> and throwing off the bold later.  add proper handling of # to app.js.
There is only room for a single level of heading.  make a single # the only option, and it should be the size of heading-3.  Also, there is a significant amount of empty space around the outside of all content.  remove this extra margin/padding.
Add cache busting to the css as well.  There is still some available space on the left.  the horizontal lines dont extend to the page edge, and there is additional margin or padding inside the main body container.  make the outer container 0, remove card left and right margins if any, and the content padding 0.1 rem.
on the wrestle page, there is a hebrew concept hegah (probably mis-transliterated) that has the image of a lion growling over its kill as it slowly digests it, that is used in scripture as an image of studying the scripture.  Is this accurate?  if so, add it to the more... content on the wrestling page.
Now the wrestling page more... entry is two columns with scrolling.  This doesn't work.  i have to scroll down the left column, then back up to the top of the right column, then back down.  I see two options to fix this, either make the more page only allow two column if it fits the entire page, and fall back to a single column if a scroll bar is still required.  Or split large more... pages into multiple pages and modify the up/down actions to scroll through these. It seems like the single column approach is the way to go.  that still requires overriding up/down to scroll, but we shouldnt be drilling down from a detail page, and they can return to the main page if they need to.
swipe and arrow up/down should be interpreted as scrolling up/down on more... pages.  also it seems I still have to delete browsing history to see the latest updates.  do you see anything else that can force a reload on every browser refresh?

in @data/site/PotentialBiases.md under section 1.2, is there an example of precision guarding heresy that isn't rooted in pagan dualism or deism?  if not, remove this section wherever it shows up.  a point I am trying to make is that dualism and deism are the foreign concepts that leeched into Christianity and took us down the wrong path theologically.

It seems to me that even calling God, Jesus, and and the Holy Spirit "persons" is importing the greek concept of hypostasis and trying to soften the language. The Holy Spirit is the Spirit of God. Jesus is the Son of God filled with the Spirit of God. This makes them deity, each in their own way for their own reasons.  the Spirit of God is the conduit of His Power into the world, but I can't think of a single instance where the spirit is worshipped or God tells us to do so. But when the Spirit fills the Son, God is pleased, and He does tell us to worship Him. Let's start using Bible language to explain Bible concepts.  Person isn't helpful here.

section 9.3 and 9.5 also need to update Trinity language to biblical language

Great, I agree with @data/site/PotentialBiases.md now.  Please apply this framework to the entire site now.

ok, let's add one more handout to the Bible section. The class ended last week with a discussion on homosexuality. The handout should list each of the main scriptures used in the debate, with a list of concise bullet points describing the arguments both sides use to defend their position from these scriptures. Include Gen 1/2, Sodom and Gomorrah and Jude, Leviticus 18/20, Romans 1, the arsenokoitai question, and anything else I am missing that is even close to this topic. No editorial or conclusions, just the verses and concise argument list.

Research and summarize the following three theological positions on God's relationship with time. I need accurate, detailed information for a theology handout. Focus on primary sources and scholarly consensus: (1) Classical/Calvinist view (Eternal/Timeless God) - Augustine, Boethius, Aquinas, Calvin; (2) Arminian view (specifically Arminius himself) - simple foreknowledge, difference from Calvinist temporality, Wesley; (3) Second Temple Jewish views - Rabbinic literature, Dead Sea Scrolls/Qumran, Philo, Josephus on Pharisees/Sadducees/Essenes, intertestamental literature. Also include key scriptures in the "God changes His mind" discussion.

Let's begin the theology handout with a quick discussion on the attributes of God, followed by the Jewish idea of theology based on how God acts, then some example scriptures showing how God changes his mind. The big picture is questioning God's interaction with time. Does the future exist yet? Is there anything there (then?) for God to see and know? Or has He created a reality where He is walking through the here and now along with us. In this view, He has more power to change things over larger scales, and more intelligence and wisdom to know what will help, but is watching the future unfold along with us. Obviously the standard eternal model is the Greek (and Calvin) viewpoint, but what did Armenius believe? How about 2nd temple Jews? Include a discussion of these 3 viewpoints.

link it from data/god/god.md similar to how we linked the handouts to data/bible/bible.md
add guardrails section to god-and-time handout defining outer limits of Christian orthodoxy on the doctrine of God
remove Trinity guardrail (#4) from god-and-time handout - too internally contested; Messianic Jews and others have legitimate Christian perspectives that resist Trinitarian formulation
update guardrail #1 to remove Trinity language (keep only 'Father Son Spirit are not 3 separate gods'); add new guardrail about God being specifically the God of Israel/Bible/People of the Book
add Allah to the list of other gods in guardrail #1 alongside Baal, Aphrodite, Zeus
document is biased toward Open Theism - add more biblical evidence for the timeless/classical perspective
You are Arius of Alexandria (c. 256-336 AD), the theologian whose views on Christ's nature provoked the Council of Nicaea. You are contributing to a collaborative handout titled "Jesus: What Does It Mean to Be the Son of God?" for a conservative Christian audience. Present your actual historical position honestly and with biblical evidence. [Full prompt with four sections: Guardrails, Your View (Son of God), Honest Tensions, Applications — Common Ground]

You are a traditional Trinitarian Christian theologian contributing to a collaborative handout titled "Jesus: What Does It Mean to Be the Son of God?" This handout is for a conservative Christian audience studying systematic theology. The handout uses accessible language — no seminary jargon.

Your role: Represent the traditional Trinitarian/Nicene view of Christ's identity.

Sections requested:
1. GUARDRAILS — Outer Boundaries (universal Christian non-negotiables)
2. YOUR VIEW: What Does It Mean to Be "the Son of God"? (Trinitarian view with extensive biblical evidence)
3. HONEST TENSIONS IN YOUR VIEW (genuine difficulties in the Trinitarian position)
4. APPLICATIONS — What Should We All Agree On? (practical applications across Christological views)
You are a Jewish theologian who believes the Christian doctrine of the Trinity is functionally tritheism — three gods, not one. You are contributing to a collaborative handout titled "Jesus: What Does It Mean to Be the Son of God?" for a conservative Christian audience. Your role is to present the Jewish critique honestly and with biblical evidence, helping Christians understand why Judaism sees the Trinity as a departure from biblical monotheism. You are NOT hostile. You are a respectful dialogue partner who takes the Hebrew Scriptures seriously and wants Christians to understand the Jewish perspective. Sections: (1) GUARDRAILS — Outer Boundaries You'd Agree With, (2) YOUR VIEW: What Does "Son of God" Mean in Jewish Context? (with extensive biblical evidence from the Hebrew Scriptures), (3) WHAT CHRISTIANS SHOULD UNDERSTAND, (4) APPLICATIONS — Common Ground.

You are Sabellius (early 3rd century AD), the theologian who taught Modalism — the view that Father, Son, and Holy Spirit are not three distinct persons but three modes or manifestations of one God. You are contributing to a collaborative handout titled "Jesus: What Does It Mean to Be the Son of God?" for a conservative Christian audience. Present your actual historical position honestly and with biblical evidence. [Full prompt with four sections: Guardrails, Your View (Son of God), Honest Tensions, Applications — Common Ground. Core position: one God, one person, three redemptive modes. Son of God = God Himself in Incarnate/Redemptive mode. Against both Arianism (makes two beings) and Trinitarianism (introduces irreducible distinctions into the divine person).]
You are a first-century Jewish Christian who holds to Spirit Christology — the view that Jesus was a human being uniquely anointed and empowered by God's Spirit, making him God's Son in a functional/relational sense rather than in the later Nicene ontological sense. You are contributing to a collaborative handout titled "Jesus: What Does It Mean to Be the Son of God?" for a conservative Christian audience. [Full prompt with four sections: Guardrails, Your View with extensive biblical evidence, Honest Tensions, Applications — Common Ground. Persona: genuine believer in Jesus as Messiah and Lord, reading Scripture through a first-century Jewish lens rather than a fourth-century Greek philosophical lens.]

You are Arius of Alexandria (c. 256-336 AD), the theologian whose views on Christ's nature provoked the Council of Nicaea. You are contributing to a collaborative handout titled "Jesus: What Does It Mean to Be the Son of God?" for a conservative Christian audience. Present your actual historical position honestly and with biblical evidence. [Full prompt with four sections: Guardrails, Your View (the Son is first and greatest creation, Father is greater in nature not just role, Son was begotten and therefore had a beginning, against Nicene homoousios), Honest Tensions, Applications — Common Ground.]

[After all five agents returned their contributions, synthesize into a single cohesive handout at handouts/son-of-god.md following the god-and-time.md format. Link from data/jesus/jesus.md. Target ~370 lines / 8 dense pages.]

In @handouts/son-of-god.md include the most prominent OT Christophanies in section IV.

add Melchizedek to the Christophanies section

In the comments on the Jewish perspective on John 1:1, I have seen memra associated with the Word as well as dabar. How are these terms related? Was the Targum written near the time of Plato? Is the expansion of the Memra a nod to the idea that God must be too holy to touch the physical world, so the translators needed to add a proxy any time that seemed to happen? Add it to both places (Christophany intro and John 1:1 grid).

That is a good addition, but the sentiment is a little off. By choosing a Word (pun intended) with such rich linguistic heritage to introduce us to Jesus, John is masterfully telling the whole world "He is here for you."

Excellent. I honestly cried when I read your intro to John 1:1. Wouldn't Spirit Christology be more aligned with this view as well, though?

Is there a sense that the Spirit of God is God's core or the center of His power? If so, and if the Spirit of God filled Jesus without measure, and if Jesus as a sinless, perfect vessel was the One being filled, can it be said that God put ALL of himself into Jesus, and this is the sense in which Jesus became God? Would a Spirit Christologist disagree with any of these statements? Add it to the Spirit Christology section.

now review the whole handout for consistency with these additions

at * A note on the Word - dabar, Memra, Logos, the rest of the document seems to have italic and regular text reversed.

Please change all scripture references to ESV, NIV, NET, or AMP. Record that these are the preferred translations in CLAUDE.md

Why does Spirit Christology seem to shy away from the immaculate conception and focus on indwelling at the Baptism? There should be a section on Jesus' unique conception and what the different views believe happened to Mary when she became pregnant with Jesus. Not to be crude, but Jesus at least has a Y chromosome that didn't come from Mary.

now review the whole handout for consistency with the virgin conception section

how long was Mark around and how widely circulated before the same communities began to see Matthew and Luke?

yes please

Add the standard trinity image to the Trinity view for illustration, the triangle with God in the middle, Father, Son, and Spirit at the corners, "is" pointing in, and "is not" on the outside. If there are similar visualizations of the other views, add them. Don't use code blocks, use mermaid diagrams.

handout renderer says: Error Failed to load handout: Assignment to constant variable.

Add to CLAUDE.md that a background server should be automatically started whenever claude starts in this repo. Start one.

One more missing concept I have read - Jesus is a mobile tabernacle - filled with the Shekinah glory of God. Tabernacle language shows up at both His birth and baptism. If this is true, it means Jesus is literally the presence of God walking among us. Is this a stretch or is it well supported in the Scripture?

absolutely
