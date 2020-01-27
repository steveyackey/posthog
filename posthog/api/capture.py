from posthog.models import Event, Team, Person, Element
from django.http import HttpResponse, JsonResponse
import json
import base64
from django.views.decorators.csrf import csrf_exempt
from urllib.parse import urlparse
from django.db import transaction


def get_ip_address(request):
    """ use requestobject to fetch client machine's IP Address """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')    ### Real IP address of client Machine
    return ip   

def cors_response(request, response):
    url = urlparse(request.META['HTTP_REFERER'])
    response["Access-Control-Allow-Origin"] = "%s://%s" % (url.scheme, url.netloc)
    response["Access-Control-Allow-Credentials"] = 'true'
    response["Access-Control-Allow-Methods"] = 'GET, POST, OPTIONS'
    response["Access-Control-Allow-Headers"] = 'X-Requested-With'
    return response

@csrf_exempt
def get_event(request):
    if request.method == 'POST':
        data = request.POST.get('data')
    else:
        data = request.GET.get('data')
    if not data:
        return cors_response(request, HttpResponse("1"))
    
    data = json.loads(base64.b64decode(data))
    team = Team.objects.get(api_token=data['properties']['token'])

    distinct_id = str(data['properties']['distinct_id'])
    data['properties']['distinct_id'] = distinct_id
    elements = data['properties'].get('$elements')
    if elements:
        del data['properties']['$elements']
    event = Event.objects.create(
        event=data['event'],
        properties=data['properties'],
        ip=get_ip_address(request),
        team=team
    )
    if elements: 
        Element.objects.bulk_create([
            Element(
                text=el.get('$el_text'),
                tag_name=el['tag_name'],
                href=el.get('attr__href'),
                attr_id=el.get('attr__id'),
                nth_child=el.get('nth_child'),
                nth_of_type=el.get('nth_of_type'),
                attributes={key: value for key, value in el.items() if key.startswith('attr__')},
                team=team,
                event=event,
                order=index
            ) for index, el in enumerate(elements)
        ])

    with transaction.atomic():
        if not Person.objects.filter(team=team, distinct_ids__contains=[distinct_id]).exists():
            Person.objects.create(team=team, distinct_ids=[distinct_id], is_user=request.user if not request.user.is_anonymous else None)
    return cors_response(request, HttpResponse("1"))


@csrf_exempt
def get_decide(request):
    return cors_response(request, JsonResponse({"config": {"enable_collect_everything": True}}))

@csrf_exempt
def get_engage(request):
    if request.method == 'POST':
        data = request.POST.get('data')
    else:
        data = request.GET.get('data')
    if not data:
        return cors_response(request, HttpResponse("1"))
    
    data = json.loads(base64.b64decode(data))
    team = Team.objects.get(api_token=data['$token'])

    # sometimes race condition creates 2 people. Just fix that for now
    person = Person.objects.filter(team=team, distinct_ids__contains=[str(data['$distinct_id'])]).first()
    if data.get('$set'):
        person.properties = data['$set']
        person.save()
 
    return cors_response(request, HttpResponse("1"))