from rest_framework import serializers
from .models import JourFerie
from teams.models import Region


class JourFerieSerializer(serializers.ModelSerializer):
    regions_ids = serializers.PrimaryKeyRelatedField(
        source='regions', queryset=Region.objects.all(),
        many=True, required=False
    )
    regions_noms = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    toutes_regions = serializers.SerializerMethodField()

    class Meta:
        model = JourFerie
        fields = [
            'id', 'jour', 'libelle', 'type', 'type_display',
            'regions_ids', 'regions_noms', 'toutes_regions', 'created_at'
        ]
        read_only_fields = ['created_at']

    def get_regions_noms(self, obj):
        return [r.nom for r in obj.regions.all()]

    def get_toutes_regions(self, obj):
        return obj.regions.count() == 0

    def create(self, validated_data):
        regions = validated_data.pop('regions', [])
        instance = JourFerie.objects.create(**validated_data)
        instance.regions.set(regions)
        return instance

    def update(self, instance, validated_data):
        regions = validated_data.pop('regions', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if regions is not None:
            instance.regions.set(regions)
        return instance
