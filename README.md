node-swtor
==========

Development
-----------

For building from scratch, you need to do the following:

1. Install node and npm
2. npm install -g jake component
3. cd src/js && component install (temporary until a bug is fixed)
4. cd ../.. && jake build

When making changes to things that would be in the data/content directory, instead
make the changes to the files in the src directory. Files in data/content are
rebuilt on every `jake build`.