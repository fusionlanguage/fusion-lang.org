test: index.html playground.js libfut.js
	$(LOCALAPPDATA)/Programs/Opera/opera --allow-file-access-from-files file:///$(shell cygpath -am $<)
