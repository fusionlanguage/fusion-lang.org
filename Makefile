test: playground.html playground.js fut.js
	$(LOCALAPPDATA)/Programs/Opera/launcher --allow-file-access-from-files file:///$(shell cygpath -am $<)
