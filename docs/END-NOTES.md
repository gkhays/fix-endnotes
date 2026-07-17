# End Notes Feature

When using AI assistants, they will frequently cite their sources in an end-note style:

>In Python projects on GitHub, there isn't just one single tool; the landscape is divided between package build backends (used to package your code for distribution) and task runners/automation tools (used to run tests, linters, and build steps). [1, 2, 3, 4] 

Where 1, 2, 3, 4 are of the form:
[1](https://medium.com/@akashnagpal112/best-python-build-tools-every-developer-should-know-in-2026-5460e70980cf#:~:text=SCons%20replaces%20traditional%20Makefiles%20with%20Python%20scripts%2C,logic.%20It%20excels%20in%20projects%20that%20need),

[2](https://medium.com/@akashnagpal112/best-python-build-tools-every-developer-should-know-in-2026-5460e70980cf#:~:text=Some%20Python%20build%20tools%20include:%20*%20**Poetry**,into%20a%20single%20file%20*%20**Setuptools**%20Well),

etc.

In some cases, the "end-notes" may appear at the end of a prompt response in the following format:

[1] https://medium.com/@akashnagpal112/best-python-build-tools-every-developer-should-know-in-2026-5460e70980cf
[2] https://medium.com/@akashnagpal112/best-python-build-tools-every-developer-should-know-in-2026-5460e70980cf
[3] https://discuss.python.org/t/modernising-my-packages-am-i-thinking-about-this-all-wrong/14558
[4] https://www.pyopensci.org/python-package-guide/package-structure-code/python-package-build-tools.html

## Obsidian and Markdown Issues

In Markdown and Obsidian, the `[]` characters are special and signify part of a link, e.g. [description](<link>).

However, when interacting with AI assistant output, Obsidian and Markdown view the "end-notes" as a nested link, e.g.

[[1](<link1>), [2](<link2>)]

Albeit a degenerate one as there is no parenthetical link-value in the outer link. When we encounter these, we want to escape them so they display properly, e.g.

\[[1](<link1>), [2](<link2>)\]