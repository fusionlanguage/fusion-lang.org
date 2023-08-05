test: playground.html playground.js libfut.js
	$(LOCALAPPDATA)/Programs/Opera/launcher --allow-file-access-from-files file:///$(shell cygpath -am $<)
