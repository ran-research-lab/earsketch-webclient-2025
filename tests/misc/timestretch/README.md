This is a simple browser-based benchmarking of timestretching processes. It compares the request and process times for:
(1) SOX on ESWS LMC-DEV
(2) ESWS fetch wav (no timestretch) + Kali (client-side timestretch)

To run the test,
- Set the `N` (requests) in the first line of `index.js`,
- Set `compareResults` (flag for sample-wise comparison between ESWS and Kali outputs) and `thresh` (the absolute-value difference for each sample that is considered as a significant error) in the lines 3-4 of `index.js`,
then serve as localhost and open in a browser. It is recommended to clear the temp audio cache folder on server first with `rm /makebeat/www/html/earsketch2/sound/temp/*`.