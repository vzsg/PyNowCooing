import os
import sys
from base64 import b64encode
from aiohttp import web
from winrt.windows.media.control import GlobalSystemMediaTransportControlsSessionManager as MediaManager
from winrt.windows.storage.streams import Buffer, InputStreamOptions

async def read_stream_into_buffer(stream_ref, buffer):
    with await stream_ref.open_read_async() as readable_stream:
        await readable_stream.read_async(buffer, buffer.capacity, InputStreamOptions.READ_AHEAD)

async def get_media_info():
    sessions = await MediaManager.request_async()
    current_session = sessions.get_current_session()
    if current_session:
        info = await current_session.try_get_media_properties_async()
        info_dict = {'artist': clean_artist(info.artist), 'title': info.title.strip() }
    
        if info.thumbnail is not None:
            thumb_stream_ref = info.thumbnail
            thumb_read_buffer = Buffer(5000000)
            await read_stream_into_buffer(thumb_stream_ref, thumb_read_buffer)
            info_dict['thumbnail'] = 'data:image/jpeg;base64,' + b64encode(thumb_read_buffer).decode('ascii')
    
        return info_dict

    return {}

def clean_artist(artist):
    # Apple Music sends the album name in the artist field, separated with an em dash
    if ' \u2014 ' in artist:
        return artist.split(u' \u2014 ')[0].strip()
    return artist.strip()

def get_resource_path(*path_parts):
    # Handles resource paths for PyInstaller bundles and normal execution
    if hasattr(sys, '_MEIPASS'):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(__file__)
    return os.path.join(base_path, *path_parts)

async def media_handler(request):
    media_info = await get_media_info()
    return web.json_response(media_info)

async def index_handler(request):
    return web.FileResponse(get_resource_path('static', 'index.html'))

app = web.Application()
app.router.add_get('/api', media_handler)
app.router.add_get('/', index_handler)
app.router.add_static('/', get_resource_path('static'), show_index=False)

if __name__ == '__main__':
    port = os.getenv('PORT')
    web.run_app(app, host='127.0.0.1', port=port if port is not None else 8080)