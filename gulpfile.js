const { watch } = require('gulp');
const path = require('node:path');
const { exec } = require('child_process');
const fs = require('fs');

const templates = {
    webp: (file, width, height) =>
        `<img class="cornered" title="?"\n    width="${width}" height="${height}" src="${file}">`,
    jpeg: (file, width, height) =>
        `<img class="cornered" title="?"\n    width="${width}" height="${height}" src="${file}">`,
    gif: (file, width, height) =>
        `<img class="cornered" title="?"\n    width="${width}" height="${height}" src="${file}">`,
    mp4: (file, width, height) =>
        `<video width="600px" controls>\n    <source src="${file}" type="video/mp4">\n</video>`,
    webm: (file, width, height) =>
        `<video class="how-to" width="${width}" height="${height}" loop autoplay muted>\n    <source src="${file}" type="video/webm">\n</video>`
};

const commands = {
    identify: file => `identify '${file}'`,
    toWebP: (src, dst) => [
        `convert '${src}'`,
        `'${dst}'`
    ].join(' '),
    toJpeg: (src, dst) => [
        `convert '${src}'`,
        '-quality 80',
        `'${dst}'`
    ].join(' '),
    toGif: (src, dst) => [
        `ffmpeg -i '${src}'`,
        '-vf "fps=10,split[s0][s1];[s0]palettegen=max_colors=32[p];[s1][p]paletteuse=dither=bayer"',
        `'${dst}'`
    ].join(' '),
    toMp4: (src, dst) => [
        `ffmpeg -i '${src}'`,
        '-vcodec h264',
        '-acodec mp2',
        `'${dst}'`
    ].join(' '),
    toWebM: (src, dst) => [
        `ffmpeg -i '${src}'`,
        '-vcodec libvpx-vp9',
        '-b:v 1M',
        '-crf 33',
        '-acodec libvorbis',
        `'${dst}'`
    ].join(' ')
};

const folders = {
    webp: 'watch/2webp',
    jpeg: 'watch/2jpeg',
    gif: 'watch/2gif',
    mp4: 'watch/2mp4',
    webm: 'watch/2webm',
    backup: 'watch/backup'
};

for (const dir of [folders.webp, folders.jpeg, folders.gif, folders.mp4, folders.webm, folders.backup]) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function identify(file, template) {
    const identify = exec(commands.identify(file));
    let stdout = '';
    identify.stdout.on('data', data => stdout += data);
    identify.addListener('close', code => {
        if (code === 0) {
            const [, w, h] = stdout.match(/(\d+)x(\d+)/);
            const width = Math.floor(parseInt(w) / 2);
            const height = Math.floor(parseInt(h) / 2);
            console.log(template(file, width, height));
        }
    });
}

function toWebP(png) {
    const { name, base } = path.parse(png);
    const webp = path.join('watch', name + '.webp');
    console.log('converting', png, 'to', webp);

    const cmd = commands.toWebP(png, webp);
    console.log(cmd);

    const convert = exec(cmd);
    convert.addListener('close', code => {
        console.log('done', code);
        if (code === 0) {
            try {
                fs.renameSync(png, path.join(folders.backup, base));
            } catch (e) { }
            identify(png, templates.webp);
        }
    });
}

function toJpeg(png) {
    const { name, base } = path.parse(png);
    const jpg = path.join('watch', name + '.jpg');
    console.log('converting', png, 'to', jpg);

    const cmd = commands.toJpeg(png, jpg);
    console.log(cmd);

    const convert = exec(cmd);
    convert.addListener('close', code => {
        console.log('done', code);
        if (code === 0) {
            try {
                fs.renameSync(png, path.join(folders.backup, base));
            } catch (e) { }
            identify(jpg, templates.jpeg);
        }
    });
}

function toGif(mov) {
    const { name, base } = path.parse(mov);
    const gif = path.join('watch', name + '.gif');

    const cmd = commands.toGif(mov, gif);
    console.log(cmd);

    const ffmpeg = exec(cmd);
    ffmpeg.stderr.on('data', data => console.log(data));
    ffmpeg.addListener('close', code => {
        console.log('done', code);
        if (code === 0) {
            try {
                fs.renameSync(png, path.join(folders.backup, base));
            } catch (e) { }
            identify(gif, templates.gif);
        }
    });
}

function toMp4(mov) {
    const { name, base } = path.parse(mov);
    const mp4 = path.join('watch', name + '.mp4');

    const cmd = commands.toMp4(mov, mp4);
    console.log(cmd);

    const ffmpeg = exec(cmd);
    ffmpeg.stderr.on('data', data => console.log(data));
    ffmpeg.addListener('close', code => {
        console.log('done', code);
        if (code === 0) {
            try {
                fs.renameSync(png, path.join(folders.backup, base));
            } catch (e) { }
            identify(mp4, templates.mp4);
        }
    });
}

function toWebM(mov) {
    const { name, base } = path.parse(mov);
    const webm = path.join('watch', name + '.webm');

    const cmd = commands.toWebM(mov, webm);
    console.log(cmd);

    const ffmpeg = exec(cmd);
    ffmpeg.stderr.on('data', data => console.log(data));
    ffmpeg.addListener('close', code => {
        console.log('done', code);
        if (code === 0) {
            try {
                fs.renameSync(mov, path.join(folders.backup, base));
            } catch (e) { }
            identify(webm, templates.webm);
        }
    });
}

exec('open watch');

exports.default = function () {
    watch(['watch/2webp/*.png']).on('add', (file) => {
        console.log('added file', file);
        toWebP(file);
    });
    watch(['watch/2jpeg/*.png']).on('add', (file) => {
        console.log('added file', file);
        toJpeg(file);
    });
    watch(['watch/2gif/*.mov']).on('add', (file) => {
        console.log('added file', file)
        toGif(file);
    });
    watch(['watch/2mp4/*.mov']).on('add', (file) => {
        console.log('added file', file)
        toMp4(file);
    });
    watch(['watch/2webm/*.mov']).on('add', (file) => {
        console.log('added file', file)
        toWebM(file);
    });
};
