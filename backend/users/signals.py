from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg
from .models import Review

@receiver(post_save, sender=Review)
@receiver(post_delete, sender=Review)
def update_worker_rating(sender, instance, **kwargs):
    worker = instance.worker
    reviews = worker.reviews.all()
    if reviews.exists():
        avg_rating = reviews.aggregate(Avg('overall_rating'))['overall_rating__avg']
        worker.rating = round(avg_rating, 1)
    else:
        worker.rating = 0.0
    worker.save()
