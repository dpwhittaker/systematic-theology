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
