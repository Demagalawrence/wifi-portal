from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Plan, PlanFeature
from .serializers import PlanSerializer, PlanDetailSerializer


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def plan_list(request):
    """Get all active plans"""
    plans = Plan.objects.filter(is_active=True).order_by('sort_order', 'price')
    serializer = PlanSerializer(plans, many=True)
    return Response({
        'plans': serializer.data,
        'count': plans.count()
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def plan_detail(request, plan_id):
    """Get detailed information about a specific plan"""
    try:
        plan = Plan.objects.get(id=plan_id, is_active=True)
        serializer = PlanDetailSerializer(plan)
        return Response(serializer.data)
    except Plan.DoesNotExist:
        return Response(
            {'error': 'Plan not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def create_plan(request):
    """Create a new plan (admin only)"""
    serializer = PlanSerializer(data=request.data)
    if serializer.is_valid():
        plan = serializer.save()
        return Response(
            PlanDetailSerializer(plan).data, 
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAdminUser])
def update_plan(request, plan_id):
    """Update a plan (admin only)"""
    try:
        plan = Plan.objects.get(id=plan_id)
        serializer = PlanSerializer(plan, data=request.data, partial=True)
        if serializer.is_valid():
            plan = serializer.save()
            return Response(PlanDetailSerializer(plan).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Plan.DoesNotExist:
        return Response(
            {'error': 'Plan not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['DELETE'])
@permission_classes([permissions.IsAdminUser])
def delete_plan(request, plan_id):
    """Delete a plan (admin only)"""
    try:
        plan = Plan.objects.get(id=plan_id)
        plan.delete()
        return Response(
            {'message': 'Plan deleted successfully'}, 
            status=status.HTTP_204_NO_CONTENT
        )
    except Plan.DoesNotExist:
        return Response(
            {'error': 'Plan not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def add_plan_feature(request, plan_id):
    """Add a feature to a plan (admin only)"""
    try:
        plan = Plan.objects.get(id=plan_id)
        feature_name = request.data.get('feature_name')
        is_included = request.data.get('is_included', True)
        
        if not feature_name:
            return Response(
                {'error': 'feature_name is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        feature = PlanFeature.objects.create(
            plan=plan,
            feature_name=feature_name,
            is_included=is_included
        )
        
        return Response(
            {'message': 'Feature added successfully', 'feature': feature.feature_name},
            status=status.HTTP_201_CREATED
        )
    except Plan.DoesNotExist:
        return Response(
            {'error': 'Plan not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
